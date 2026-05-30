package main

import (
	"encoding/json"
	"fmt"
	"log"
	//"math/rand"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type User struct {
	ID       uint   `gorm:"primaryKey"`
	Username string `gorm:"size:255;not null"`
	Email    string `gorm:"uniqueIndex;not null"`
}

type Question struct {
	gorm.Model
	Qid     uint     `gorm:"primaryKey"`
	Text    string   `gorm:"not null" json:"text"`
	Answer  string   `gorm:"not null" json:"answer"`
	Options []string `gorm:"serializer:json" json:"options"` // Fixed: Capitalized 'Options' so it's exported and visible to JSON/GORM
}

func createQuestions(w http.ResponseWriter, r *http.Request, db *gorm.DB) {
	var q Question
	err := json.NewDecoder(r.Body).Decode(&q)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	res := db.Create(&q)
	if res.Error != nil {
		fmt.Println("Error while inserting data.. ", res.Error)
		http.Error(w, "Database insertion failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(q)
	fmt.Println("Inserted ........")
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { // allow all origins for now, I will change it later for production.
		return true
	},
}

var wg sync.WaitGroup

type Client struct {
	conn          *websocket.Conn
	send          chan []byte
	competitionId string
	userId        string
}

type Hub struct {
	mu            sync.Mutex
	rooms         map[string]map[*Client]bool
	questionIndex map[string]int
	answers       map[string]map[string]bool // competitionId -> userId -> answered
	questions     []Question
}

func newHub() *Hub {
	return &Hub{
		rooms:         make(map[string]map[*Client]bool),
		questionIndex: make(map[string]int),
		answers:       make(map[string]map[string]bool),
		questions:     []Question{},
	}
}

func (h *Hub) register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	room := c.competitionId
	if _, ok := h.rooms[room]; !ok {
		h.rooms[room] = make(map[*Client]bool)
	}
	h.rooms[room][c] = true
	if _, ok := h.answers[room]; !ok {
		h.answers[room] = make(map[string]bool)
	}
}

func (h *Hub) unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	room := c.competitionId
	if conns, ok := h.rooms[room]; ok {
		delete(conns, c)
		close(c.send)
		fmt.Println("channel close at unregsiter function")
		if len(conns) == 0 {
			delete(h.rooms, room)
			delete(h.questionIndex, room)
			delete(h.answers, room)
		}
	}
}

func (h *Hub) moveClientRoom(c *Client, newRoom string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	oldRoom := c.competitionId
	if oldConns, ok := h.rooms[oldRoom]; ok {
		delete(oldConns, c)
		if len(oldConns) == 0 {
			delete(h.rooms, oldRoom)
			delete(h.questionIndex, oldRoom)
			delete(h.answers, oldRoom)
		}
	}
	if _, ok := h.rooms[newRoom]; !ok {
		h.rooms[newRoom] = make(map[*Client]bool)
	}
	h.rooms[newRoom][c] = true
	if _, ok := h.answers[newRoom]; !ok {
		h.answers[newRoom] = make(map[string]bool)
	}
	c.competitionId = newRoom
}

func (h *Hub) broadcastToRoom(room string, message any) {
	h.mu.Lock()
	defer h.mu.Unlock()
	data, _ := json.Marshal(message)
	for c := range h.rooms[room] {
		select {
		case c.send <- data:
		default:
			// If the client's send buffer is full, remove it
			delete(h.rooms[room], c)
			close(c.send)
		}
	}
}

func (h *Hub) loadQuestionsFromDB(db *gorm.DB) {
	var qs []Question
	if err := db.Find(&qs).Error; err == nil && len(qs) > 0 {
		h.questions = qs
	}
}

func (h *Hub) getQuestionForRoom(room string) *Question {
	h.mu.Lock()
	defer h.mu.Unlock()
	if len(h.questions) == 0 {
		return nil
	}
	// idx := h.questionIndex[room]
	// if idx >= len(h.questions) {
	// 	// wrap-around or random pick
	// 	idx = rand.Intn(len(h.questions))
	// 	h.questionIndex[room] = idx
	// }
	q := h.questions[0]
	// 
	h.questionIndex[room] += 1
	fmt.Println("question index: ", h.questionIndex[room])
	if h.questionIndex[room] == 15 { h.questions = nil } // simulate end of questions after 5 rounds for testing
	return &q
}

func mustMarshal(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

// handleWS manages websocket clients and uses a simple hub/room model to broadcast
// questions and answer results. It is designed to be compatible with the
// StartCompetitionPage.tsx frontend message shapes.
func handleWS(w http.ResponseWriter, r *http.Request, db *gorm.DB, hub *Hub) {
	
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("WS upgrade failed:", err)
		return
	}

	client := &Client{conn: conn, send: make(chan []byte, 16), competitionId: "global", userId: ""}
    
	// Start a writer goroutine
	// n := 0
	go func() {
		// n += 1
		// fmt.Println("Starting writer goroutine for client ", n)
		defer conn.Close()
		
		for msg := range client.send {
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				fmt.Println("WS write error (client likely disconnected):", err)
				return
			}
		}
	}()

	// Register client immediately to default room; it may update on messages
	hub.register(client)

	// Send an initial question to the room (if we have questions loaded)
	if q := hub.getQuestionForRoom(client.competitionId); q != nil {
		payload := map[string]any{"type": "question", "question": map[string]any{"id": q.Qid, "text": q.Text, "options": q.Options}}
		client.send <- mustMarshal(payload)
	}

	// Reader loop
	for {
		var raw map[string]any
		if err := conn.ReadJSON(&raw); err != nil {
			fmt.Println("WS read error (client likely disconnected):", err)
			break
		}
        fmt.Printf("Received message from client: %v\n", raw)
		// If client provided competitionId or userId, set them and (re)register
		if comp, ok := raw["competitionId"].(string); ok && comp != "" && comp != client.competitionId {
			// move client to the specified room without closing the websocket
			hub.moveClientRoom(client, comp)
		}
		if uid, ok := raw["userId"].(string); ok && uid != "" {
			client.userId = uid
		}

		// If this is an answer submission
		if ans, ok := raw["answer"].(string); ok {
			// Evaluate against the current question for the room
			room := client.competitionId
			q := hub.getQuestionForRoom(room)
			correct := false
			if q != nil && ans == q.Answer {
				correct = true
			}

			// Mark this user as answered
			hub.mu.Lock()
			if _, ok := hub.answers[room]; !ok {
				hub.answers[room] = make(map[string]bool)
			}
			hub.answers[room][client.userId] = true
			answeredCount := len(hub.answers[room])
			totalPlayers := len(hub.rooms[room])
			hub.mu.Unlock()

			// Send answer result back to the submitting client
			resp := map[string]any{"type": "answer_result", "correct": correct, "message": func() string { if correct { return "1" } else { return "0" } }()}
			client.send <- mustMarshal(resp)
            fmt.Println("Sent answer result to the client through channel. ")
			// Notify other players in the room that opponent has answered
			hub.broadcastToRoom(room, map[string]any{"opponentStatus": "answered"})

			// If all connected players have answered, advance to next question and reset answers
			if totalPlayers > 0 && answeredCount >= totalPlayers {
				hub.mu.Lock()
				hub.answers[room] = make(map[string]bool)
				hub.mu.Unlock()

				// small delay so clients can show feedback
				time.AfterFunc(900*time.Millisecond, func() {
					if nq := hub.getQuestionForRoom(room); nq != nil && hub.questions != nil {
						hub.broadcastToRoom(room, map[string]any{"type": "question", "question": map[string]any{"id": nq.Qid, "text": nq.Text, "options": nq.Options}})
						// also set opponentStatus back to thinking
						hub.broadcastToRoom(room, map[string]any{"opponentStatus": "thinking"})
					} else {
						// no questions => end game
						hub.broadcastToRoom(room, map[string]any{"type": "game_result", "outcome": "draw"})
					}
				})
			}
		}
	}
	
    fmt.Println("Client disconnected, cleaning up...")
	// cleanup on disconnect
	hub.unregister(client)
	conn.Close()
	fmt.Println("WS connection closed")
}

func main() {
	dsn := "host=localhost user=postgres password=12345678 dbname=schoolsdb port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		// Log the actual error message to see why your DB connection is failing!
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Database connected successfully!")

	db.AutoMigrate(&User{})
	db.AutoMigrate(&Question{})

	hub := newHub()
	hub.loadQuestionsFromDB(db)

	http.HandleFunc("/questions", func(w http.ResponseWriter, r *http.Request) {
		handleWS(w, r, db, hub)
	})

	http.HandleFunc("/createQuestion", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		createQuestions(w, r, db)
	})

	fmt.Println("Server starting on :8080...")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
