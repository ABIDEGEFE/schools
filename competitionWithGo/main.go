package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)


type Question struct {
	gorm.Model
	Qid     uint     `gorm:"primaryKey"`
	Text    string   `gorm:"not null" json:"text"`
	Answer  string   `gorm:"not null" json:"answer"`
	Options []string `gorm:"serializer:json" json:"options"`
}

type Competition_result struct {
	ID            uint `gorm:"primaryKey"`
	UserId        string  `gorm: "not null" json:"userId"`
	OpponentId    string  `gorm: "not null" json:"opponentId"`
	Result        int   `gorm: "not null" json:"result"` // total number of answers correct by the user
	CompetitionId string  `gorm: "not null" json: "competitionId"`
	Answer		string `gorm: "-" json:"answer"`
	QuestionId	string   `gorm: "-" json:"questionId"`
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
	// answers       map[string]map[string]bool // check if a user has answered the current question in a room
	questions     []Question
	// track how many answers each user has submitted per room
	answerCounts   map[string]map[string]int // room -> userId -> count
	// mark when a user finished all questions for a room
	finished       map[string]map[string]bool // room -> userId -> finished
	// mark when a user's final result has been saved to DB
	// savedResults   map[string]map[string]bool // room -> userId -> saved
	// total questions expected per room
	totalQuestions map[string]int // room -> total questions
	// track how many correct answers each user has per room
	correctCounts  map[string]map[string]int // room -> userId -> correctCount
	// connectedClients map[string]int // room -> number of connected clients
	// players map[string]map[string]bool
}

func newHub() *Hub { // initialize all maps in the Hub struct
	return &Hub{
		rooms:         make(map[string]map[*Client]bool),
		questionIndex: make(map[string]int),
		// answers:       make(map[string]map[string]bool),
		questions:     []Question{},
		answerCounts:   make(map[string]map[string]int),
		finished:       make(map[string]map[string]bool),
		// savedResults:   make(map[string]map[string]bool),
		totalQuestions: make(map[string]int),
		correctCounts:  make(map[string]map[string]int),
		// connectedClients: make(map[string]int),
		// players: make(map[string]map[string]bool),
	}
}

func (h *Hub) register(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	room := c.competitionId
	if _, ok := h.rooms[room]; !ok {   // if it is not initialized, initialize the room map
		h.rooms[room] = make(map[*Client]bool)
	}
	// check if the client with the same userId already exists in the room; if so, do not add again
	for existingClient := range h.rooms[room] {
		if existingClient.userId == c.userId {
			fmt.Printf("Client with userId %s already exists in room %s, skipping registration\n", c.userId, room)
			// delete(h.rooms[existingClient.competitionId], existingClient) // remove the old client connection for this userId
			return
		}	
	}
	h.rooms[room][c] = true // add client to the room
	// if _, ok := h.answers[room]; !ok {
	// 	h.answers[room] = make(map[string]bool)
	// }
	if _, ok := h.answerCounts[room]; !ok {
		h.answerCounts[room] = make(map[string]int)
	}
	if _, ok := h.finished[room]; !ok {
		h.finished[room] = make(map[string]bool)
	}
	// if _, ok := h.savedResults[room]; !ok {
	// 	h.savedResults[room] = make(map[string]bool)
	// }
	if _, ok := h.correctCounts[room]; !ok {
		h.correctCounts[room] = make(map[string]int)
	}
	// if _, ok := h.connectedClients[room]; !ok {
	// 	h.connectedClients[room] = 0
	// }
	// if _, ok := h.players[room]; !ok {
	// 	h.players[room] = make(map[string]bool)
	// }
	// h.players[room][c.userId] = true
	// h.connectedClients[room] += 1
	// set total questions for the room from loaded questions (fallback to 10)
	if _, ok := h.totalQuestions[room]; !ok {
		if len(h.questions) > 0 {
			h.totalQuestions[room] = 10
		} else {
			h.totalQuestions[room] = 0
		}
	}
}

func (h *Hub) unregister(c *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()
	room := c.competitionId
	if conns, ok := h.rooms[room]; ok {
		delete(conns, c) // remove client from the room
		close(c.send)
		fmt.Println("channel close at unregsiter function")
		if len(conns) == 0 {
			delete(h.rooms, room)
			delete(h.questionIndex, room)
			// delete(h.answers, room)
		}
	}
	// h.connectedClients[room] -= 1
	// if h.connectedClients[room] == 0 {
	// 	delete(h.connectedClients, room)
	// }
}

// func (h *Hub) moveClientRoom(c *Client, newRoom string) {
// 	h.mu.Lock()
// 	defer h.mu.Unlock()
// 	oldRoom := c.competitionId
// 	if oldConns, ok := h.rooms[oldRoom]; ok {
// 		delete(oldConns, c) // remove client from old room
// 		// h.connectedClients[oldRoom] -= 1
// 		if len(oldConns) == 0 {
// 			delete(h.rooms, oldRoom)
// 			delete(h.questionIndex, oldRoom)
// 			// delete(h.answers, oldRoom)
// 		}
// 	}
// 	if _, ok := h.rooms[newRoom]; !ok {
// 		h.rooms[newRoom] = make(map[*Client]bool)
// 	}
// 	h.rooms[newRoom][c] = true // add client to new room
// 	// h.connectedClients[newRoom] += 1
// 	// if _, ok := h.answers[newRoom]; !ok {
// 	// 	h.answers[newRoom] = make(map[string]bool)
// 	// }
// 	if _, ok := h.answerCounts[newRoom]; !ok {
// 		h.answerCounts[newRoom] = make(map[string]int)
// 	}
// 	if _, ok := h.finished[newRoom]; !ok {
// 		h.finished[newRoom] = make(map[string]bool)
// 	}
// 	if _, ok := h.savedResults[newRoom]; !ok {
// 		h.savedResults[newRoom] = make(map[string]bool)
// 	}
// 	if _, ok := h.correctCounts[newRoom]; !ok {
// 		h.correctCounts[newRoom] = make(map[string]int)
// 	}
// 	if _, ok := h.players[newRoom]; !ok {
//         h.players[newRoom] = make(map[string]bool)
// 	}
// 	h.players[newRoom][c.userId] = true
// 	fmt.Printf("players in room %s: %v\n", newRoom, h.players[newRoom])
// 	if _, ok := h.totalQuestions[newRoom]; !ok {
// 		if len(h.questions) > 0 {
// 			h.totalQuestions[newRoom] = 10
// 		} else {
// 			h.totalQuestions[newRoom] = 0
// 		}
// 	}
// 	c.competitionId = newRoom
// }

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
	// to prevent loading similar questions for every room, we will load random questions once and serve them to specific room. 
	if err := db.Find(&qs).Error; err == nil && len(qs) > 0 {
		h.questions = qs
	}
}

func (h *Hub) checkAllDone(room string) bool {
    h.mu.Lock()
	defer h.mu.Unlock()
	// count := 0
	for c := range h.rooms[room] {
		// count++
		// why length of client is always 1 after both clients are connected?

		fmt.Println("Lenght of clients: ", len(h.rooms[room]))
		println("Checking if user ", c.userId, " has finished and saved result... ", h.finished[room][c.userId])
		if c.userId != "" {
			if !h.finished[room][c.userId] {
				return false
			}
		}
	}
	// fmt.Println("Total connected clients in room ", room, ": ", count)
	return true
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
	// // 
	// h.questionIndex[room] += 1
	// fmt.Println("question index: ", h.questionIndex[room])
	// if h.questionIndex[room] == 10 { h.questions = nil } // simulate end of questions after 5 rounds for testing
	return &q
}

func mustMarshal(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

type InitPayload struct {
	Action string `json:"action"`
	UserId string `json:"userId"`
	CompetitionId string `json:"competitionId"`
	OpponentId string `json:"opponentId"`

}
// handleWS manages websocket clients and uses a simple hub/room model to broadcast
// questions and answer results. It is designed to be compatible with the
// StartCompetitionPage.tsx frontend message shapes.

func handleWS(w http.ResponseWriter, r *http.Request, db *gorm.DB, hub *Hub) {
	
	conn, err := upgrader.Upgrade(w, r, nil)

	if err != nil {
		fmt.Println("WS upgrade failed:", err)
		return
	} else {
		fmt.Println("New WS client connected")
	}

	textMessage, p, err := conn.ReadMessage()
	if err != nil {
		fmt.Println("WS read error during initialization:", err)
		conn.Close()
		return
	}

	if textMessage != websocket.TextMessage {
		fmt.Println("Unexpected message type")
		conn.Close()
		return
	}

	var payload InitPayload
	if err := json.Unmarshal(p, &payload); err != nil {
		fmt.Println("WS JSON unmarshal error during initialization:", err)
		conn.Close()
		return
	}

	client := &Client{conn: conn, send: make(chan []byte, 16), competitionId: payload.CompetitionId, userId: payload.UserId}
	
	// Start a writer goroutine
	// n := 0
	go func() {
		defer conn.Close()
		// hub.mu.Lock()
		for msg := range client.send {
			if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
				fmt.Println("WS write error (client likely disconnected):", err)
				return
			}
		}
		// hub.mu.Unlock()
	}()

	// Register client immediately to default room; it may update on messages
	hub.register(client)

	// Send an initial question to the room (if we have questions loaded and both clients are connected)
	fmt.Println("Current clients in room after registration: ", hub.rooms[client.competitionId])
	if len(hub.rooms[client.competitionId]) == 2 {
		fmt.Println("Both clients connected, sending initial question to room ",hub.rooms)
		if q := hub.getQuestionForRoom(client.competitionId); q != nil {
		    payload := map[string]any{"type": "question", "question": map[string]any{"id": q.Qid, "text": q.Text, "options": q.Options}}
			hub.broadcastToRoom(client.competitionId, payload)
		    // client.send <- mustMarshal(payload)
	    }
	} else {
		fmt.Println("Waiting for opponent to connect to room ", hub.rooms[client.competitionId])
	}


	// Reader loop
	for {
		var raw Competition_result
		
		if err := conn.ReadJSON(&raw); err != nil {
			fmt.Println("WS read error (client likely disconnected):", err)
			break
		}
        
		// fmt.Println("Received message from client###3**********: ", raw)
		// if comp := raw.CompetitionId; comp != "" && comp != client.competitionId {
		// 	// move client to the specified room without closing the websocket
		// 	fmt.Printf("Client requested to join competition room: %s\n", comp)
		// 	hub.moveClientRoom(client, comp)
		// } 

		// if uid:= raw.UserId; uid != "" {
		// 	client.userId = uid
		// 	fmt.Printf("Client set userId: %s\n", uid)
		// }

		// If this is an answer submission
		if ans:= raw.Answer; ans != "" {
			// Evaluate against the current question for the room
			room := client.competitionId
			q := hub.getQuestionForRoom(room)
			correct := false
			if q != nil && ans == q.Answer {
				correct = true
			}

			// Mark this user as answered and increment their per-room answer count
			hub.mu.Lock()
			// if _, ok := hub.answers[room]; !ok {
			// 	hub.answers[room] = make(map[string]bool)
			// }
			// hub.answers[room][client.userId] = true
			if _, ok := hub.answerCounts[room]; !ok {
				hub.answerCounts[room] = make(map[string]int)
			}
			hub.answerCounts[room][client.userId] += 1
			// increment correct count server-side
			if correct {
				if _, ok := hub.correctCounts[room]; !ok {
					hub.correctCounts[room] = make(map[string]int)
				}
				hub.correctCounts[room][client.userId] += 1
			}
			// answeredCount := len(hub.answers[room]) // number of users who have answered the current question in this room
			// totalPlayers := len(hub.rooms[room])
			// ensure totalQuestions is set
			totalQ := hub.totalQuestions[room]
			// mark finished if this user reached expected total
			if hub.answerCounts[room][client.userId] >= totalQ {
				hub.finished[room][client.userId] = true
				// fmt.Println("marked as finished $$$$$$$$$$$$$")
			}
			hub.mu.Unlock()

			// Send answer result back to the submitting client
			resp := map[string]any{"type": "answer_result", "correct": correct, "message": func() string { if correct { return "1" } else { return "0" } }()}
			client.send <- mustMarshal(resp)
            fmt.Println("Sent answer result to the client through channel. ")
			// Notify other players in the room that opponent has answered
			hub.broadcastToRoom(room, map[string]any{"opponentStatus": "answered"})

			// If all connected players have answered, advance to next question and reset answers
			if !hub.finished[room][client.userId] {
				hub.mu.Lock()
				hub.mu.Unlock()
				// // hub.answers[room] = make(map[string]bool)

				// small delay so clients can show feedback

				time.AfterFunc(900*time.Millisecond, func() {
					
					if nq := hub.getQuestionForRoom(room); nq != nil && hub.questions != nil {
						fmt.Println("Broadcasting next question to room ", room)
						hub.broadcastToRoom(room, map[string]any{"type": "question", "question": map[string]any{"id": nq.Qid, "text": nq.Text, "options": nq.Options}})
						// also set opponentStatus back to thinking
						hub.broadcastToRoom(room, map[string]any{"opponentStatus": "thinking"})
					} else {
						return
					}
						// fmt.Println("No more questions available for room ", room)
						// questions exhausted for this room - do not immediately compute result here
						// instead, ensure we only compute final outcome once every player has finished
					
				})
			}

			// If this submission caused the user to finish all questions, save their final result
			// (raw should include `Result`, `UserId`, `OpponentId`, `CompetitionId` from client)
			// ensure raw has the correct competition id
			// When a user finishes, persist their computed correct count as the final result
			// if func() bool {
			// 	hub.mu.Lock()
			// 	finished := hub.finished[room][client.userId]
			// 	// saved := hub.savedResults[room][client.userId]
			// 	hub.mu.Unlock()
			// 	return finished
			// }() {
			// 	// compute server-side correct count
			// 	hub.mu.Lock()
			// 	correctCount := hub.correctCounts[room][client.userId]
			// 	hub.mu.Unlock()
			// 	cr := Competition_result{
			// 		UserId:        client.userId,
			// 		OpponentId:    raw.OpponentId,
			// 		Result:        correctCount,
			// 		CompetitionId: room,
			// 	}
			// 	if err := db.Omit("answer").Create(&cr).Error; err != nil {
			// 		fmt.Println("Error saving final result for user:", err)
			// 	} else {
			// 		println("competition status saved...#####")
			// 		hub.mu.Lock()
			// 		// hub.savedResults[room][client.userId] = true
			// 		hub.mu.Unlock()
			// 	}
			// }

			// Check whether all connected players have finished and their results are saved.
			// allDone := true
			// playerIDs := []string{} // reset playerIDs for this check
			// hub.mu.Lock()
			// fmt.Println("Connected clients in room ", room, ": ", hub.players)
			// for c := range hub.rooms[room] {
			// 	fmt.Println("This is the client user id: ", c.userId)
			// 	if c.userId != "" {
			// 		playerIDs = append(playerIDs, c.userId)
			// 	}
			// }
			// fmt.Println("Player IDs in the room: ", playerIDs)
			/// iterate over the items in the room and check if all players have finished
			// for i := 0; i < len(playerIDs); i++ {
			// 	pid := playerIDs[i]
			// 	fmt.Println("ID of CURRENTLY CONNECTED USERS @@@@@@@@@ ", i, " ", pid)
			// 	if !hub.finished[room][pid] {
			// 		fmt.Println("all not done $$$$$$$$$$$$$$4")
			// 		// allDone = false
			// 		break
			// 	}
			// }
			// hub.mu.Unlock()

			if hub.checkAllDone(room) {
				results := make(map[string]int)
                results[client.userId] = hub.correctCounts[room][client.userId]
				if hub.correctCounts[room][client.userId] > hub.correctCounts[room][payload.OpponentId] {
					hub.broadcastToRoom(room, map[string]any{"type": "game_result", "results": hub.correctCounts[room], "winnerId": client.userId, "draw": false})
				} else if hub.correctCounts[room][client.userId] < hub.correctCounts[room][payload.OpponentId] {
					hub.broadcastToRoom(room, map[string]any{"type": "game_result", "results": results, "winnerId": payload.OpponentId, "draw": false})
				} else {
					hub.broadcastToRoom(room, map[string]any{"type": "game_result", "results": results, "winnerId": "", "draw": true})
				}

				// for i := 0; i < len(playerIDs); i++ {
				// 	pid := playerIDs[i]
				// 	fmt.Println("Connected user Ids: ", pid)
				// 	var cr Competition_result
				// 	if err := db.Where("competition_id = ? AND user_id = ?", room, pid).First(&cr).Error; err != nil {
				// 		fmt.Println("Error fetching saved result for user", pid, ":", err)
				// 		results[pid] = 0
				// 	} else {
				// 		fmt.Println("competition result retrived from database ############3")
				// 		results[pid] = cr.Result
				// 	}
				// }

				// compute outcome: identify winner or draw
				// if len(playerIDs) == 1 {
				// 	fmt.Println("saved palyer ids **********  ", playerId)
				// 	hub.broadcastToRoom(room, map[string]any{"type": "game_result", "results": results, "winnerId": playerIDs[0], "draw": false})
				// 	return
				// }
				// find max score and possible winners
				// maxScore := -1
				// winners := []string{}
				// for pid, sc := range results {
				// 	if sc > maxScore {
				// 		maxScore = sc
				// 		winners = []string{pid}
				// 	} else if sc == maxScore {
				// 		winners = append(winners, pid)
				// 	}
				// }
				// if len(winners) > 1 {
				// 	// draw
				// 	fmt.Println("the competiotion ends up with equal result ", results)
				// 	hub.broadcastToRoom(room, map[string]any{"type": "game_result", "results": results, "winnerId": "", "draw": true})
				// } else {
				// 	// single winner
				// 	fmt.Println("There is only one winner ", results)
				// 	hub.broadcastToRoom(room, map[string]any{"type": "game_result", "results": results, "winnerId": winners[0], "draw": false})
				// }
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

	// db.AutoMigrate(&User{})
	db.AutoMigrate(&Question{})
	db.AutoMigrate(&Competition_result{})

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
