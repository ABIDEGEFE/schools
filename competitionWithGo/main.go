package main


import (

	"fmt"
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

/*var upgrader = websocket.Upgrader(

	// CheckOrigin: func(r *http.Request)bool{ return true }
)*/

/*type Question struct {

	QuestionId int
        Answer string
	Text string

}*/
/*func sendQuestions(w http.ResponseWriter, r *http.Request){

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {

		fmt.Println("Error creating connection ", err)
		return
	}

}

func login(){

}

func evaluateAnswer(w http.ResponseWriter, r *http.Request){

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil { 
		fmt.Println("Error creating connection ", err)
		return
	}

}

func announceWinner(){

}*/

func main(){
        
	/*http.HandleFunc("/questions", sendQuestions)
	http.HandleFunc("/login", login)
	http.HandleFunc("/respond", evaluateAnswer)
	http.HandleFunc("/result", announceWinner)*/

	dsn := "host=localhost user=postgres password=12345678 dbname=competition port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})

	if err != nil { panic("Failed to connect") }
	db.AutoMigrate(&User{})
        db.AutoMigrate(&Question{})

	//questionChan := make(chan Question)
	fmt.Println("hellow go")
}
