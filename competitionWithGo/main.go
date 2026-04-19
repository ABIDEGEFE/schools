package main


import (

	"fmt"
	"sync"
	// "net/http"
	// "github.com/gorilla/websocket"
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
/*var upgrader = websocket.Upgrader(

	// CheckOrigin: func(r *http.Request)bool{ return true }
)*/

/*type Question struct {

	QuestionId int
        Answer string
	Text string

}*/
func sendQuestions(db *gorm.DB, ques chan <- Question, wg *sync.WaitGroup){
        
	defer wg.Done()
	var question Question
	// Qustions would be retrived randomly from the database
	randomId := 1
	res := db.Find(&question, randomId)
	if res.Error != nil {
               fmt.Println("Error while retrieving....")
	       return
	}

	ques <- question
        close(ques)
	/*conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {

		fmt.Println("Error creating connection ", err)
		return
	}*/

}
/*
func login(){

}
*/
func evaluateAnswer(quse <- chan Question, wg *sync.WaitGroup){
        
	defer wg.Done()
	//simulate user answer
	userAnswer := "True"
	
	for res := range quse{
           if userAnswer == res.Answer{
	      // return true for the client
              fmt.Println("Correct!")
	   }else{
	      // return false for the client
              fmt.Println("Incorrect!")
	   }
	}
	/*conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil { 
		fmt.Println("Error creating connection ", err)
		return
	}*/

}
/*
func announceWinner(){

	// get the final score of both players
	// compare and announce who the winner is

}*/

func main(){

	var wg sync.WaitGroup
	ansChan := make(chan Question)
	/*http.HandleFunc("/questions", sendQuestions)
	http.HandleFunc("/login", login)
	http.HandleFunc("/respond", evaluateAnswer)
	http.HandleFunc("/result", announceWinner)*/

	dsn := "host=localhost user=postgres password=12345678 dbname=competition port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil { panic("Failed to connect") }
	db.AutoMigrate(&User{})
        db.AutoMigrate(&Question{})
        
	wg.Add(1)
	go createQuestions(db, &wg)

	wg.Add(1)
	go sendQuestions(db, ansChan, &wg)

	wg.Add(1)
	go evaluateAnswer(ansChan, &wg)

	wg.Wait()
	//questionChan := make(chan Question)
	fmt.Println("hellow go")
}
