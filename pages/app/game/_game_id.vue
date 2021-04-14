<template>
    <div>
        {{ game_id }}
        <button @click="ping">ping</button>
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
            socket: io('http://127.0.0.1:3334/').socket,
            game_id: this.game_id
        }
    },
    methods:{
        ping(){
            this.socket.emit('ping')
            console.log("Pinging!")
        }
    }


}
</script>