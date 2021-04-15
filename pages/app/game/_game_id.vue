<template>
    <div>
        {{ game_id }}
        <h1>Players {{ players }}</h1>
        <button @click="ping">ping</button>
        <button @click="leave">Leave</button>
        <button @click="start">Start</button>
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
            user_id: null
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

        this.socket.on("game-start", () => {
            console.log("Game starting");
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
    },
    methods:{
        ping(){
            this.socket.emit('see')
            console.log("Pinging!")
        },
        leave(){
            if(this.connected){
                this.socket.emit('leave-game', JSON.stringify({"game_id": this.game_id,"user_id": this.user_id}))
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
        }
    }


}
</script>