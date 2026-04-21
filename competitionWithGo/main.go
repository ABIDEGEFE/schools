package main


import (

	"fmt"
       // "encoding/json"
	// "strings"
	"sync"
	"log"
	"net/http"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
	"gorm.io/driver/postgres"
)

type User struct {

	ID uint `gorm:"primaryKey"`
	Username string `gorm:"size:255;not null"`
	Email string `gorm:"uniqueIndex;not null"`
}

type Question struct {

	Qid uint `gorm:"primaryKey"`
	Text string `gorm:"not null"`
	Answer string `gorm:"not null"`
}

func createQuestions(db *gorm.DB, wg *sync.WaitGroup){
	defer wg.Done()
	questions := Question {
         
		Text: "Ethiopia is found in Asia",
		Answer: "False",
           
	}

	res := db.Create(&questions)
	if res.Error != nil {
           fmt.Println("Error while inseting data.. ", res.Error)
	}
	fmt.Println("Inserted ........")

}
var upgrader = websocket.Upgrader{

	CheckOrigin: func(r *http.Request)bool {
            return true
	},
}

/*type Question struct {

	QuestionId int
        Answer string
	Text string

}*/
func sendQuestions(w http.ResponseWriter, r *http.Request, db *gorm.DB){
        
	fmt.Println("start of sendQuestion")

	var question Question
	// Qustions would be retrived randomly from the database
	randomId := 1
	res := db.Find(&question, randomId)
	if res.Error != nil {
               fmt.Println("Error while retrieving....")
	       return
	}


	fmt.Println("after sending channel...")
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {

		fmt.Println("Error creating connection ", err)
		return
	}

	response := map[string]string{
		"Text": question.Text,
	}

	err = conn.WriteJSON(response)

	if err != nil {
            fmt.Println("Error while sending questions ....", err)
	    return
    } 
        
	for {

		var req struct {
                    Answer string `json:"answer"`
		}
                
		err := conn.ReadJSON(&req)
		if err != nil {
                   fmt.Println("Error while reading answers ", err)
		}
                
	        if req.Answer == "close" {
		     break
	        }
		result := "0"
		fmt.Println(req.Answer, question.Answer)

                if req.Answer == question.Answer {
			result = "1"
		}

		conn.WriteJSON(map[string]string{"message": result})
	}
        defer conn.Close()
        //fmt.Println("questions sent for the client")	
        //ques <- question
	//close(ques)
}
/*
func login(){

}
*/
/*
func announceWinner(){

	// get the final score of both players
	// compare and announce who the winner is

}*/

func main(){

	var wg sync.WaitGroup
//	ansChan := make(chan Question)
	//http.HandleFunc("/questions", sendQuestions(db, ansChan, &wg))
	/*http.HandleFunc("/login", login)
	http.HandleFunc("/respond", evaluateAnswer)
	http.HandleFunc("/result", announceWinner)*/

	dsn := "host=localhost user=postgres password=12345678 dbname=competition port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil { panic("Failed to connect") }
	db.AutoMigrate(&User{})
        db.AutoMigrate(&Question{})
        
	http.HandleFunc("/questions", func(w http.ResponseWriter, r *http.Request){
                 
		go sendQuestions(w, r, db)
		fmt.Println("check ..")

	})

	/*http.HandleFunc("/result", func(w http.ResponseWriter, r *http.Request){
	     wg.Add(1)
             go evaluateAnswer(w, r, ansChan, &wg)
	})*/

	fmt.Println("Connecting........")

	log.Fatal(http.ListenAndServe(":8080", nil))
	//wg.Add(1)
	//go createQuestions(db, &wg)

	//wg.Add(1)
	//go sendQuestions(w, r, db, ansChan, &wg)

	//wg.Add(1)
	//go evaluateAnswer(ansChan, &wg)

	//wg.Wait()
	//questionChan := make(chan Question)
	fmt.Println("hellow go")
}
