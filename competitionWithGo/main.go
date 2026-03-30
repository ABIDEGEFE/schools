package main


import (

	"fmt"
	"net/http"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader(

	CheckOrigin: func(r *http.Request)bool{ return true }
)

type Question struct {

	QuestionId int,
	Subject string,
        Answer string
	Text string

}
func sendQuestions(w http.ResponseWriter, r *http.Request){

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

}

func main(){
        
	http.HandleFunc("/questions", sendQuestions)
	http.HandleFunc("/login", login)
	http.HandleFunc("/respond", evaluateAnswer)
	http.HandleFunc("/result", announceWinner)

	questionChan := make(chan Question)
	fmt.Println("hellow go")
}
