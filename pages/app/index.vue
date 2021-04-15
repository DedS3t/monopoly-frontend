<template>
    <div>
        <form @submit.prevent="createGame">
            <input type="text" placeholder="Game Name" v-model="form.name">
            <input type="submit" value="Create Game" />
        </form>

        <form @submit.prevent="joinGame">
            <input type="text" placeholder="Game Name" v-model="joinForm.code">
            <input type="submit" value="Join Game" />
        </form>
        <button @click="logout">Logout</button>
        <h1>Currently {{ gameLength }} public games available</h1>
        <div v-for="game in games" :key="game.Id">
            <h1>Game: {{ game.Name }} <NuxtLink :to="'/app/game/' + game.Id">Join</NuxtLink></h1>
        </div>
    </div>
</template>


<script>
export default {
    data(){
        return {
            form: {
                name: ""
            },
            joinForm: {
                code: "",
            },
            games: [],
        }
    },
    async fetch(){
        let result = (await this.$axios.get("http://localhost:3333/game/all")).data
        if(result != null) this.games = result;
    },
    computed: {
        gameLength(){
            return this.games.length
        }
    },
    methods: {
        async createGame(){
            try{
                let result = (await this.$axios.post("http://localhost:3333/game/create", this.form, {headers: {'Content-Type': 'application/json'}})).data
                this.$router.push(`/app/game/${result["id"]}`)
            }catch (error){
                alert(error)
            }
        },
        async joinGame(){
            // TODO verify the code
            let result = (await this.$axios.get(`http://localhost:3333/game/verify?code=${this.joinForm.code}`, {headers: {'Content-Type': 'application/json'}})).data 
            console.log(result)
            if(result["status"]){
                 this.$router.push(`/app/game/${this.joinForm.code}`)
            }else{
                alert("Not a valid room id")
            }
           
        },
        async logout(){
            await this.$auth.logout();
            this.$router.push("/auth")
        }
    }

}
</script>
