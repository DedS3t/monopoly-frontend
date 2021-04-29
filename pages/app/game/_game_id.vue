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
            <h1>Balance: {{ currentBalance() }}</h1>
            <h1>Pos: {{ currentPosition() }}</h1>

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

            <div v-for="notification in game.notifications" :key="notification.id">
                <div class="alert" :class="notification.type">
                    <h1>{{ notification.text }}</h1>
                </div>
            </div>

            <table id="board" style="display: table;">
                <tbody>
                    <tr>
                        <td v-for="i in 11" class="border-2 cell" :key="i">
                            <div v-for="user in getUsers(i + 19)" :key="user.Color">
                                {{ user.Username }}
                            </div> 
                        </td>
                    </tr>

                    <tr v-for="n in 9" :key="n">

                        <td class="cell" style="border: 1px solid black;">
                            <div v-for="user in getUsers((10 - n) + 10)" :key="user.Color">
                                {{ user.Username }}
                            </div> 
                        </td>
                        <td colspan="9"></td>
                        <td class="cell" style="border: 1px solid black;">
                            <div v-for="user in getUsers(n + 30)" :key="user.Color">
                                {{ user.Username }}
                            </div> 
                        </td>

                    </tr>

                    <tr>
                        <td  v-for="i in 11" class="border-2 cell" :key="i">
                            <div v-for="user in getUsers(10 - (i - 1))" :key="user.Color">
                                {{ user.Username }}
                            </div> 
                        </td>
                    </tr>
                </tbody>
            </table>
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
                roll: null,
                turn: null,
                data: {},
                notifications: [],
            }
        }
    },
    async created(){
        await this.VerifyRoom();
        window.onbeforeunload = (e) => {
            this.leave()
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
            let jsonRes = JSON.parse(info)
            console.log(jsonRes)
            this.game.data = jsonRes;
            this.game.started = true;
            this.players = Object.keys(jsonRes).length
            console.log("Game starting");
            this.socket.on("change-turn", (user_id) => {
                console.log(`Turn of ${user_id}`)
                this.game.turn = user_id;
                this.game.hasRolled = false;
                this.game.roll = null
            });

            this.socket.on("game-over", () => {
                this.leave()
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
                this.game.data[this.game.turn] = {...this.game.data[this.game.turn], Pos: pos}
            })

            this.socket.on("buy-request", (info) => {
                console.log(`Buy request ${info}`)
                let json = JSON.parse(info);
                if(this.game.turn == this.user_id){
                    // see if you want to bui
                    var res = confirm(`Buy property ${json["name"]} for ${json["price"]}`)
                    if (res) {
                        this.socket.emit("request-buy", JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
                    }
                }
            });

            this.socket.on("passed-go", (info) => {
                console.log(`Passed go ${info}`)
                let [ user_id, bal ] = info.split(".");

                this.game.data[user_id] = {...this.game.data[user_id], Balance :Number(bal)}
                if(user_id == this.user_id){
                    this.addNoti("You got $200 for passing go!", 'success')
                }

                this.$forceUpdate();
            });
            
            this.socket.on("property-bought", (info) => {
                console.log(`Property bought ${info}`)
                let [ user_id, bal ] = info.split(".");

                this.game.data[user_id] = {...this.game.data[user_id], Balance:Number(bal)}
     
                if(user_id == this.user_id){
                    this.addNoti("You have bought the property", "success");
                    this.$forceUpdate();
                }
            });

            this.socket.on("payed-rent", (info) => {
                console.log(`Payed rent ${info}`)
                let [ user_id, user_id2, bal, bal2] = info.split(".")

                if(user_id == this.user_id){
                    this.addNoti(`You payed ${this.game.data[this.user_id].Balance - Number(bal)} rent`, "danger");
                }else if(user_id2 == this.user_id){
                    this.addNoti(`You got ${Number(bal2) - this.game.data[this.user_id].Balance} from rent`, 'info');
                }

                this.game.data[user_id] = {...this.game.data[user_id], Balance:Number(bal)}
                this.game.data[user_id2] = {...this.game.data[user_id2], Balance:Number(bal2)}

                if(user_id == this.user_id || user_id2 == this.user_id){
                    this.$forceUpdate()
                }

            });
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
            return this.game.data[this.user_id].Pos 
        },
        currentBalance(){
            return this.game.data[this.user_id].Balance
        },
        addNoti(text, type){
            let id = Array(17).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, 16)
            this.game.notifications.push({text,type,id})
            setTimeout(() => {
                this.game.notifications = this.game.notifications.filter(item => item.id != id)
            }, 5000)
        },
        getUsers(idx){
           
            if(idx >= 40){
                idx -= 40;
            }
            let users = []
            let ids = Object.keys(this.game.data)
            for(let i = 0; i < ids.length; i++){
                if(this.game.data[ids[i]].Pos == idx)users.push(this.game.data[ids[i]]);
            }
            return users
        }
    }


}
</script>

<style scoped>
.alert {
  padding: 20px;
  background-color: #f44336;
  color: white;
  opacity: 1;
  transition: opacity 0.6s;
  margin-bottom: 15px;
}

.alert.success {background-color: #4CAF50;}
.alert.info {background-color: #2196F3;}
.alert.warning {background-color: #ff9800;}

.closebtn {
  margin-left: 15px;
  color: white;
  font-weight: bold;
  float: right;
  font-size: 22px;
  line-height: 20px;
  cursor: pointer;
  transition: 0.3s;
}

.closebtn:hover {
  color: black;
}

.cell{
    width: 50px;
    height: 50px;
}

</style>