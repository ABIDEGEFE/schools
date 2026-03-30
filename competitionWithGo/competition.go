package main


import (

	"fmt"
	"sync"
       "time"
)

type Question struct {

	ID int
	Text string
	Answer string

}

type Answer struct {

	PlayerName string
	Response string
	QuestionID int
}

type Player struct {

	Name string
}

type ScoreBoard struct {

	mu sync.Mutex
	scores map[string]int
}

func NewScoreBoard() *ScoreBoard {
	return &ScoreBoard{
		scores: make(map[string]int),
	}
}

func (s *ScoreBoard) AddPoint(player string){

	s.mu.Lock()
	defer s.mu.Unlock()

	s.scores[player]++
}

func (s *ScoreBoard) Print(){

	s.mu.Lock()
	defer s.mu.Unlock()
	fmt.Println("Scores : ", s.scores)
}

func sendQuestions(questions []Question, ch chan<- Question){

	for _, q := range questions{

		ch <- q
	}
	close(ch)
}

func playerWorker(player Player, questions <- chan Question, answer chan<- Answer, wg *sync.WaitGroup){
        wg.Add(1)
	for q := range questions{

		ans := Answer{
                     
			PlayerName: player.Name,
			QuestionID: q.ID,
			Response: q.Answer,

		}
		answer <- ans
	}
       wg.Done()
}

func judge(answer <- chan Answer, questions map[int]Question, sb *ScoreBoard, done chan bool){

	for ans := range answer{

		q := questions[ans.QuestionID]
		if ans.Response == q.Answer{

			sb.AddPoint(ans.PlayerName)
		}
	}
	done <- true
}


func main(){

	var wg sync.WaitGroup
	questions := []Question{

		{1, "1+1", "2"},
		{2, "2+2", "4"},
		{3, "3+3", "6"},
	}

	questionMap := make(map[int]Question)
        for _, q := range questions{

		questionMap[q.ID]=q
	}

	qCh := make(chan Question)
	ansCh := make(chan Answer, 3)
	done := make(chan bool)

	sb := NewScoreBoard()

	player1 := Player{"Mamo"}
        player2 := Player{"Jhon"}

	go sendQuestions(questions, qCh)
	go playerWorker(player1, qCh, ansCh, &wg)
	go playerWorker(player2, qCh, ansCh, &wg)

	go judge(ansCh, questionMap, sb, done)
        
	time.Sleep(1 * time.Second)
	go func(){
	     wg.Wait()
	     close(ansCh)
	}()
        
	<-done
	sb.Print()

}
