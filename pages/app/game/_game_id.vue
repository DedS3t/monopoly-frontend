<template>
    <div>
        {{ game_id }}
        <h1>Players {{ players }}</h1>
        <div v-if="!game.started">
            <button @click="ping">ping</button>
            <button @click="leave">Leave</button>
            <button @click="start">Start</button>
        </div>

        <div v-else>
            <h1>Balance: {{ game.balance }}</h1>
            <h1>Pos: {{ currentPosition() }}</h1>
            <h1>Board</h1>

            <div v-if="game.turn">
                <h1>Turn: {{ game.turn }}</h1>
                <div v-if="game.turn == user_id">
                    <h1>Your turn</h1>
                    <div v-if="game.roll">
                        <h1>Dice 1: {{ game.roll["dice1"] }}</h1>
                        <h1>Dice 2: {{ game.roll["dice2"] }}</h1>
                    </div> 
                    <button v-if="!game.hasRolled" @click="rollDice">Roll dice</button>
                    <button @click="finishTurn">Finish turn</button>
                </div>
                
            </div>
        </div>

    </div>
</template>

<script>
import io from 'socket.io-client'

export default {

    async asyncData({ params }) {
        const game_id = params.game_id;
        return { game_id };
    },
    data(){
        return {
            socket: io('http://127.0.0.1:8000/'),
            game_id: this.game_id,
            players: 0,
            connected: false,
            user_id: null,
            game: {
                started: false,
                hasRolled: false,
                balance: null,
                roll: null,
                turn: null,
                positions: {},
            }
        }
    },
    async created(){
        await this.VerifyRoom();
        window.onbeforeunload = (e) => {
            if(!e) e = window.event;
            e.cancelBubble = true;
            e.returnValue = 'You sure you want to leave?'; 

            if (e.stopPropagation) {
                this.leave();
                e.stopPropagation();
                e.preventDefault();
            }
        }
        console.log("emmiting join room")

        this.socket.on("failed", () => {
            this.$router.push("/app/")
        })
        let user_id = (await this.$axios.get("http://localhost:3333/user/cur")).data
        this.user_id = user_id
        this.socket.emit('join-game', JSON.stringify({"game_id": this.game_id, "user_id": user_id}))
        this.socket.on('joined-game', (message) => {
            console.log(message)
            this.players = parseInt(message)
            this.connected = true;
        });

        this.socket.on('player-join', () => {
            console.log("Player joined")
            this.players += 1;
        });


        this.socket.on('player-left', () =>{
            console.log("player left")
            this.players -= 1;
        })

        setTimeout(() => {
            if(!this.connected){
                this.$router.push("/app/")
            }
        }, 5000)

        this.socket.on("game-start", (info) => {
            let [ bal, pos ] = info.split(".").map(Number)
            this.game.balance = bal;
            this.game.positions[this.user_id] = pos;
            this.game.started = true 
            console.log("Game starting");
            this.socket.on("change-turn", (user_id) => {
                console.log(`Turn of ${user_id}`)
                this.game.turn = user_id;
                this.game.hasRolled = false;
                this.game.roll = null
            });

            this.socket.on("game-over", () => {
                this.$router.push("/app/")
            });

            this.socket.on("dice-roll", (info) => {
                console.log(`Dice rolled ${info}`)
                let [ dice1, dice2, pos ] = info.split(".").map(Number)
                if(this.game.turn == this.user_id){
                    if (dice1 != dice2) this.game.hasRolled = true
                    this.game.roll = {
                        "dice1": dice1,
                        "dice2": dice2
                    }  
                }
                this.game.positions[this.game.turn] = pos;


            })
        });
    },
    methods:{
        ping(){
            this.socket.emit('see')
            console.log("Pinging!")
        },
        leave(){
            if(this.connected){
                this.socket.emit('leave-game', JSON.stringify({"game_id": this.game_id,"user_id": this.user_id}))
                this.socket.destroy();
            }
            this.$router.push("/app/")
        },
        async VerifyRoom(){
            let result = (await this.$axios.get(`http://localhost:3333/game/verify?code=${this.game_id}`, {headers: {'Content-Type': 'application/json'}})).data
            console.log(result);
            if(result["status"] != true){
                this.$router.push("/app/")
            }
        },
        start() {
            this.socket.emit("start-game", this.game_id)
        },
        finishTurn(){
            this.socket.emit('end-turn', JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
        },
        rollDice(){
            this.socket.emit('roll-dice', JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
        },
        currentPosition(){
            return this.game.positions[this.user_id]
        }
    }


}
</script>