<template>
    <div>
        <button @click="speak = !speak">
            <i v-if="speak" class="fas fa-volume-up text-2xl"></i>
            <i v-else class="fas fa-volume-mute text-2xl"></i>
        </button>
        <div v-if="!game.started" class="center-top text-center">
            <h1 class="font-bold text-6xl">Code: {{ game_id }}</h1>
            <h1 class="text-5xl">Players: {{ players }}</h1>
            <div class="mt-5">
                <button @click="start" class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-blue-600 to-blue-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110">Start</button>
                <button @click="leave" class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-red-600 to-red-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110">Leave</button>
            </div>

            
        </div>

        <div v-else class="center" style="z-index: 100">
            <div class="tab">
                <button class="tablinks" @click="activeTab=0">Game</button>
                <button class="tablinks" @click="activeTab=1">Properties</button>
                <button class="tablinks" @click="activeTab=2">Players</button>
                <button class="tablink" @click="activeTab=3">Info</button>
            </div>

            <!-- Game Data -->
            <div v-if="activeTab == 0" class="tabcontent">
                <h1>Balance: {{ currentBalance() }}</h1>
                <h1>Pos: {{ currentPosition() }}</h1>
                <div v-if="game.turn">
                <h1>Turn: {{ game.data[game.turn].Username }} <span v-if="game.turn == user_id">(You)</span></h1>
                    <div v-if="game.turn == user_id">
                        <div v-if="isInJail()">
                            <h1 class="text-red-700">You are in jail</h1>
                            <button @click="payOutOfJail">Pay $50 to get out</button>
                        </div> 
                        <div v-if="game.roll">
                            <h1>Dice 1: <i :class="getClass(game.roll['dice1'])"></i></h1>
                            <h1>Dice 2: <i :class="getClass(game.roll['dice2'])"></i></h1>
                        </div> 
                        <button v-if="!game.hasRolled" @click="rollDice">Roll <i class="fas fa-dice"></i></button>
                        <p><button @click="finishTurn">Finish turn</button></p>
                    </div>
                </div>
            </div>

            <!-- Properties -->
            <div class="tabcontent" v-if="activeTab == 1">
                <div class="float-left w-1/4">
                    <button v-for="property in getProperties()" class="w-full" :key="property" @click="activeProperty = getPropertyInfo(property)">
                        {{ property }}
                    </button> 
                </div> 
                <div class="float-right w-3/4">
                    <div v-if="getProperties().length == 0">
                        Currently have zero properties
                    </div>
                    <div v-if="activeProperty">
                        <h1>Price: {{ activeProperty.price }}</h1>
                        <h1>Rent: {{ activeProperty.rent }}</h1>
                        <h1>Houses: 0</h1>
                        <button>Mortgage (${{ activeProperty.mortgage }})</button>
                        <button v-if="activeProperty.housecost">Buy House (${{ activeProperty.housecost }})</button>
                    </div> 
                </div> 

            </div>

            <!-- Players --> 
            <div class="tabcontent" v-if="activeTab == 2">
                <table>
                    <tr>
                        <th>Player</th>
                        <th>Balance</th>
                        <th>Color</th>
                        <th>Posistion</th>
                    </tr>
                    <tr v-for="player in getPlayers()" :key="player"> <!-- TODO export to components -->
                        <td>{{ game.data[player].Username }} <p v-if="player == user_id"> (You)</p></td>
                        <td>{{ game.data[player].Balance }}</td>
                        <td>{{ game.data[player].Color }}<div class="w-3 h-3" :style="'background-color:' + game.data[player].Color"></div></td>
                        <td>{{ game.data[player].Pos }}</td>
                    </tr> 
                </table>
            </div>  

            <!-- Info -->
            <div class="tabcontent" v-if="activeTab == 3">
                <h1>Game: {{ game_id }}</h1>
                <h1>Players: {{ players }}</h1>
            </div>

        </div>

        <canvas ref="canvas" id="canvas" class="center"></canvas>
        <div class="alan-btn"></div>

    </div>
</template>

<script>
import io from 'socket.io-client'
import board from '../../../components/Board'

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
            speak: false,
            activeTab: 0,
            activeProperty: null,
            openPrompt: null,
            game: {
                started: false,
                hasRolled: false,
                roll: null,
                turn: null,
                turnInfo: {},
                data: {},
                notifications: [],
            },
            canvas: {
                canvas: null,
                board: null,
                w: 0,
                h: 0,
                size: 90,
            },
            
        }
    },
    mounted(){
        var c = document.getElementById("canvas");
        this.canvas.canvas = c;
        this.canvas.board = c.getContext('2d');
        this.canvas.w = canvas.width;
        this.canvas.h = canvas.height;
        this.canvas.board.fillStyle = "#000000"
    },
    async created(){

        await this.VerifyRoom();

        alertify.set('notifier','position', 'top-center');
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
        
        /*
            Regular notifications are white bg

        */


        // alan ai stuff
        // have to add reference to this before using because of scope issues
        //let old = this;
        this.alanBtnInstance = alanBtn({
            key: "bfdc8a46d259d388244cfe8a0cbd27662e956eca572e1d8b807a3e2338fdd0dc/stage",
            onCommand: (commandData) => {
                if (commandData.command === "start") {
                    this.start();
                }else if(commandData.command === "leave") {
                    this.leave();
                }else if(commandData.command === "roll-dice") {
                    this.rollDice();
                }else if(commandData.command === "finish-turn") {
                    this.finishTurn();
                }else if(commandData.command === "buy-property") {
                    this.openPrompt.close();
                    this.openPrompt = null;
                    this.buyProperty();
                }else if(commandData.command === "view-balance"){
                    this.speakMessage("general", `Your balance is: ${this.game.data[this.user_id].Balance}`, true)
                }else if(commandData.command === "view-players"){   
                    this.activeTab = 2;
                }else if(commandData.command === "view-game"){
                    this.activeTab = 0;
                }else if(commandData.command == "view-properties"){
                    this.activeTab = 1;
                }else if(commandData.commnad == "view-location"){
                    this.speakMessage("general", `You are at ${board[this.game.data[this.user_id].Pos.toString()].name}`, true)
                }
            },
            rootEl: document.getElementById("alan-btn"),
        });

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
                this.turnInfo = {};
            });

            this.socket.on("game-over", () => {
                this.leave()
            });

            this.socket.on("dice-roll", (info) => {
               
                console.log(`Dice rolled ${info}`)
                let [ dice1, dice2, pos ] = info.split(".").map(Number)
                if(this.game.turn == this.user_id){
                    if (dice1 != dice2) this.game.hasRolled = true
                    this.speakMessage("general", `You have rolled a ${dice1 + dice2}`)
                    this.game.roll = {
                        "dice1": dice1,
                        "dice2": dice2
                    }  
                }else{
                    this.addNoti(`${this.game.data[this.game.turn].Username} rolled a ${dice1 + dice2}`, 'info')
                }
                this.game.data[this.game.turn] = {...this.game.data[this.game.turn], Pos: pos}
                this.rerender();
            })

            this.socket.on("buy-request", (info) => {
                console.log(`Buy request ${info}`)
                let json = JSON.parse(info);
                if(this.game.turn == this.user_id){
                    this.openPrompt = alertify.confirm('Buy Property', `Would you like to buy ${json["name"]} for ${json["price"]}`, () => {this.buyProperty();this.openPrompt = null},() => {this.openPrompt = null}).autoCancel(30)
                    this.speakMessage("general", `Buy property ${json["name"]} for ${json["price"]}`)
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
                let [ user_id, bal, Name ] = info.split(".");

                this.game.data[user_id] = {...this.game.data[user_id], Balance: Number(bal)}
                this.game.data[user_id]["Properties"] = [...this.game.data[user_id]["Properties"], Name]
                if(user_id == this.user_id){
                    this.addNoti("You have bought the property", "success");
                    this.speakMessage("general", `You have bought the property`)
                    this.turnInfo.buyproperty = null;
                    this.$forceUpdate();
                }else{
                    this.addNoti(`${this.game.data[this.game.turn].Username} bought ${Name}`, 'info')
                }
            });

            this.socket.on("payed-rent", (info) => {
                console.log(`Payed rent ${info}`)
                let [ user_id, user_id2, bal, bal2, change] = info.split(".")

                if(user_id == this.user_id){
                    this.addNoti(`You payed ${change} rent`, "danger");
                    this.speakMessage("general", `You payed ${change} rent`)
                }else if(user_id2 == this.user_id){
                    this.addNoti(`You got ${change} from rent`, 'info');
                    this.speakMessage("general", `You got ${change} from rent`)
                }

                this.game.data[user_id] = {...this.game.data[user_id], Balance:Number(bal)}
                this.game.data[user_id2] = {...this.game.data[user_id2], Balance:Number(bal2)}

                if(user_id == this.user_id || user_id2 == this.user_id){
                    this.$forceUpdate()
                }

            });

            this.socket.on("special", (info) => {
                console.log(`Special ${info}`)
                let result = JSON.parse(info)

                if(result["Action"] == "change"){
                    this.game.data[result["User"]] = {...this.game.data[result["User"]], Balance: Number(result["Balance"])}
                }else if(result["Action"] == "move"){
                    this.game.data[result["User"]] = {...this.game.data[result["User"]], Pos: Number(result["Pos"])}
                    this.rerender();
                }
                if(result["User"] == this.user_id){
                    this.addNoti(result["Info"], "info")
                }
            })

            this.socket.on("jail", (info) => {
                console.log(`${info} was jailed`);
                this.game.data[info] = {...this.game.data[info], Pos: 10, Jail: true}
                if(info == this.user_id){
                    this.$forceUpdate()
                    this.addNoti("You are in jail", "danger")
                    this.speakMessage("general", `You are in jail`)
                }
            });

            this.socket.on("free-jail", (info) => {
                console.log(`${info} is free from jail`)
                this.game.data[info] = {...this.game.data[info], Jail: false}
                if(info == this.user_id)  this.$forceUpdate();
            });

            this.socket.on("payment", (info) => {
                console.log(`Payment ${info}`)
                let result = JSON.parse(info)
                // TODO find out if changing state with {...this.game.data} is better than direct change
                this.game.data[info] = {...this.game.data[info], Balance: Number(result["Balance"])}
                if(result["User"] == this.user_id) {
                    this.$forceUpdate()
                    this.addNoti(result["Info"], "warning")
                }

            });

            this.socket.on("bankrupt", (info) => {
                console.log(`${info} went bankrupt`)
                if(info == this.user_id) this.leave();
                else{
                    this.addNoti(`${this.game.data[info].Username} went bankrupt`, "danger")
                    this.speakMessage("general", `${this.game.data[info].Username} went bankrupt`)
                }                
            })

            window.addEventListener('resize', this.resize);
            this.resize();
        });
        


    },
    methods:{
        leave(){
            if(this.connected){
                this.socket.emit('leave-game', JSON.stringify({"game_id": this.game_id,"user_id": this.user_id}))
            }
            this.socket.destroy();
            this.$router.push("/app/")
        },
        async VerifyRoom(){
            let result = (await this.$axios.get(`http://localhost:3333/game/verify?code=${this.game_id}`, {headers: {'Content-Type': 'application/json'}})).data
            console.log(result);
            if(result["status"] != true){
                this.$router.push("/app/")
            }
        },
        payOutOfJail(){
            if(this.game.turn == this.user_id){
                this.socket.emit("pay-out-jail", JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
            }
        },
        start() {
            if(!this.game.started){
                this.socket.emit("start-game", this.game_id)
            }   
        },
        finishTurn(){
            this.socket.emit('end-turn', JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
        },
        rollDice(){
            if(!this.game.hasRolled){
                this.socket.emit('roll-dice', JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
            }
        },
        currentPosition(){
            return this.game.data[this.user_id].Pos 
        },
        currentBalance(){
            return this.game.data[this.user_id].Balance
        },
        isInJail(){
            return this.game.data[this.user_id].Jail
        },
        addNoti(text, type){
            if(type == "danger" || type == "error"){
                alertify.error(text);
            }else if(type == "success"){
                alertify.success(text)
            }else if(type == "info"){
                alertify.notify(text, 'custom')
            }else if(type == "warning"){
                alertify.warning(text);
            }
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
        },
        getPlayers(){
            return Object.keys(this.game.data)
        },
        getCard(idx){
            if(idx >= 40){
                idx -= 40;
            }
            return board[idx.toString()]
        },
        getClass(dice){
            let arr = ["one", "two", "three", "four", "five", "six"]
            return `fas fa-dice-${arr[dice - 1]}`
        },
        buyProperty(){
            if(this.game.turn == this.user_id){
                 this.socket.emit("request-buy", JSON.stringify({"game_id": this.game_id, "user_id": this.user_id}))
            } 
        },
        getPropertyInfo(name){
            let posistions = Object.keys(board);
            for(let i = 0; i < posistions.length; i++){
                if(board[posistions[i]].name == name) return board[posistions[i]];
            }
            console.log(`Couldnt find card ${name}`)
            return null;
        }, 
        getProperties(){
            return this.game.data[this.user_id]["Properties"]
        },
        speakMessage(name, data, override = false){
            if(this.speak || override){
                this.alanBtnInstance.callProjectApi(name, {data}, (err, result) => {
                    if(error){
                        console.log(error);
                    }
                })
            }
        },
        range(size, startAt = 0) {
                return [...Array(size).keys()].map(i => i + startAt);
        },
        drawImageOnCell(x, y, path){ // draws image on cell below text
            var image = new Image();
            image.src = require(`~/assets/${path}`)
            image.addEventListener('load', () => {
                let imgWidth = (this.canvas.w / 11) / 1.5;
                let imgHeight = (this.canvas.h / 11) / 1.5;
                //this.canvas.board.drawImage(image, x + (imgWidth / 3), y + (this.canvas.h / 11) / 3, imgWidth, imgHeight)
                this.canvas.board.drawImage(image, x + (((this.canvas.w / 11) - imgWidth) / 2), y + (this.canvas.h / 11) / 3, imgWidth, imgHeight)
            }, false)
           
        },
        drawImage(x, y, path, size, callback){ // draws image to take up whole cell
            var image = new Image();
            image.src = require(`~/assets/${path}`)
            image.addEventListener('load', () => {
                this.canvas.board.drawImage(image, x, y, (this.canvas.w / 11) * size, (this.canvas.h / 11) * size)
                if(callback !== undefined) callback();
                
            }, false)
        },
        drawCell(x, y, card, users){
                let ctx = this.canvas.board;
                let w = this.canvas.w;
                let h = this.canvas.h;
                ctx.font = "15px Ariel";
                ctx.textAlign = "center";
                // draw cell
                ctx.moveTo(x, y);
                ctx.lineTo(x, y + (h / 11))
                ctx.lineTo(x + (w / 11),y + (h / 11));
                ctx.lineTo(x + (w / 11),y + 0);
                ctx.lineTo(x, y)
                // draw users
                let drawUsers = () => {
                    for(let i = 0;i < users.length; i++){
                        ctx.fillStyle = users[i].Color;
                        ctx.fillRect(x + (((w / 11) / 10) * i), y + (h / 11) / 1.25, (w / 11) / 10, (w / 11) / 10)
                    }
                    ctx.fillStyle = "#000000"
                }
                if(card.posistion == 0){
                    // handle GO
                    this.drawImage(x, y, 'go.png', 1, drawUsers);
                }else if(card.posistion == 20){
                    // handle free parking
                    this.drawImage(x, y, 'free-parking.png', 1, drawUsers);
                }else if(card.posistion == 30){
                    // handle go to jail
                    this.drawImage(x, y, 'go-to-jail.png', 1, drawUsers);
                }else if(card.posistion == 38){
                    // handle luxury tax
                    this.drawImage(x, y, 'luxury-tax.png', 1, drawUsers);
                }else if(card.posistion == 10){
                    // handle jail
                    this.drawImage(x, y, 'jail.png', 0.75, drawUsers);
                }else{
                    // draw top rect
                    if(card.group == "yellow"){ctx.fillStyle = "#f2dc49"
                    }else if(card.group == "blue"){ctx.fillStyle = "#001aff"
                    }else if(card.group == "red"){ctx.fillStyle = "#ff0000"
                    }else if(card.group == "orange"){ctx.fillStyle = "#ffa200"
                    }else if(card.group == "purple"){ctx.fillStyle = "#6200c4"
                    }else if(card.group == "lightblue"){ctx.fillStyle = "#3bc9f5"
                    }else if(card.group == "green"){ctx.fillStyle = "#396e0d"
                    }else if(card.group == "brown"){ctx.fillStyle = "#6e3e0d"}
                    if(card.type == "property" && (card.group != "railroad" && card.group != "utility")){ctx.fillRect(x, y, (w / 11), (h / 11) / 6)}
                    ctx.fillStyle = "#000000"
                    // draw name
                    ctx.fillText(card.name, x + (w / 11) / 2, y + (h / 11) / 3, (w / 11))
                    // draw price
                    if(card.price) {
                        ctx.textAlign = "start"
                        ctx.fillText(`$${card.price}`, x + 7, y + (h / 11) / 2, (w / 11) / 2)
                        ctx.textAlign = "center"
                    }
                    // handle special cards
                    if(card.type == "special"){
                        if(card.action == "chance"){
                            // handle chance card
                            this.drawImageOnCell(x, y, 'chance.png')
                        }else if(card.action == "chest"){
                            // handle chest
                            this.drawImageOnCell(x, y, 'chest.png')
                        }
                    }else if(card.group == "railroad"){
                            // handle railroads
                            this.drawImageOnCell(x, y, 'railroad.png')
                    }else if(card.posistion == 12){
                        // handle electric company
                        this.drawImageOnCell(x, y, 'electric-company.png')
                    }else if(card.posistion == 28){
                        // handle water works
                        this.drawImageOnCell(x, y, 'water-works.png')
                    }

                    drawUsers();
                }

                ctx.fillStyle = "#000000"
                ctx.stroke();
        },
        drawBoard(){
                // top row
                let w = this.canvas.w;
                let h = this.canvas.h;
                for(const i of this.range(11)){
                    this.drawCell((w / 11) * i , 0, this.getCard(i + 20), this.getUsers(i + 20))
                }
                // bottom row
                for(const i of this.range(11)){
                    this.drawCell((w / 11) * i, h - (h / 11), this.getCard(10 - i), this.getUsers(10 - i))
                }
                // right row
                for(const i of this.range(9)){
                    this.drawCell(0, (h / 11) * (i + 1), this.getCard(19 - i), this.getUsers(19 - i))
                }
                // left row
                for(const i of this.range(9)){
                    this.drawCell(w - (w / 11), (h / 11) * (i + 1), this.getCard(i + 31), this.getUsers(i + 31))
                }

        },
        resize(){
                this.canvas.canvas.height = window.innerHeight * (this.canvas.size / 100);
                this.canvas.canvas.width = window.innerWidth * (this.canvas.size / 100);
                this.canvas.w = this.canvas.canvas.width;
                this.canvas.h = this.canvas.canvas.height;
                this.drawBoard();
        },
        rerender(){
            this.resize();
        },

    },
    directives: {
        clickOutside: {
            bind(el, binding, vnode) {
                var vm = vnode.context;
                var callback = binding.value;

                el.clickOutsideEvent = function (event) {
                    if (!(el == event.target || el.contains(event.target))) {
                        return callback.call(vm, event);
                    }
                };
                document.body.addEventListener('click', el.clickOutsideEvent);
            },
            unbind(el) {
                    document.body.removeEventListener('click', el.clickOutsideEvent);
            }
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
.alert.danger {background-color:#f44336}
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
    width: 75px;
    height: 75px;
}

.center{
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%)
}

.center-top{
    position: absolute;
    left: 50%;
    top: 20%;
    transform: translate(-50%, -50%)
}

.tab {
  overflow: hidden;
  border: 1px solid #ccc;
  background-color: #f1f1f1;
}


.tab button {
  background-color: inherit;
  float: left;
  border: none;
  outline: none;
  cursor: pointer;
  padding: 14px 16px;
  transition: 0.3s;
  font-size: 17px;
}


.tab button:hover {
  background-color: #ddd;
}


.tab button.active {
  background-color: #ccc;
}


.tabcontent {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-top: none;
  min-height: 100px;
}

table {
  border-collapse: collapse;
  width: 100%;
}

td, th {
  border: 1px solid #dddddd;
  text-align: left;
  padding: 8px;
}

tr:nth-child(even) {
  background-color: #dddddd;
}

</style>