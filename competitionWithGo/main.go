package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

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
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func sendQuestions(w http.ResponseWriter, r *http.Request, db *gorm.DB) {
	fmt.Println("start of sendQuestion")

	var question Question
	randomId := 1
	res := db.First(&question, randomId) // Fixed: Changed 'Find' to 'First' to avoid empty slice bugs when looking for one item
	if res.Error != nil {
		fmt.Println("Error while retrieving question:", res.Error)
		http.Error(w, "Question not found", http.StatusNotFound)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error creating connection ", err)
		return
	}
	defer conn.Close() // Fixed: Moved 'defer' immediately after the upgrade so it ALWAYS cleans up when this function exits

	response := map[string]string{
		"Text": question.Text,
	}

	err = conn.WriteJSON(response)
	if err != nil {
		fmt.Println("Error while sending questions ....", err)
		return
	}
	// fmt.Println("Question sent to client successfully!")

	for {
		fmt.Println("Waiting for client's answer...")
		var req struct {
			Answer string `json:"answer"`
		}

		err := conn.ReadJSON(&req)
		if err != nil {
			fmt.Println("Client disconnected or read error: ", err)
			break // Fixed: Must break out of the loop if reading fails, or it will loop infinitely causing high CPU / panics
		}
        fmt.Println("Received answer from client:", req.Answer)
		if req.Answer == "close" {
			break
		}

		result := "0"
		fmt.Println("Client answered:", req.Answer, "Correct answer:", question.Answer)

		if req.Answer == question.Answer {
			result = "1"
		}

		err = conn.WriteJSON(map[string]string{"message": result})
		if err != nil {
			fmt.Println("Error writing response to client:", err)
			break
		}
	}
	fmt.Println("WebSocket connection gracefully closed.")
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

	http.HandleFunc("/questions", func(w http.ResponseWriter, r *http.Request) {
		sendQuestions(w, r, db)
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
