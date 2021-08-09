<template>
    <div>
        <button @click="logout" class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-blue-600 to-blue-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110 top-left">Logout</button>

        <h1 class="top-center font-bold text-8xl mt-4">Monopoly</h1>

        <div class="center text-center w-11/12 m-auto">
            <div class="w-2/3 m-auto">
                <h1 class="font-bold text-2xl">Create Game</h1>
                <form @submit.prevent="createGame">
                    <input type="text" placeholder="Enter Game Name" v-model="form.name">
                    <div class="w-full">
                        <select v-model="form.type" class="w-1/3 pr-10 pl-3 py-3 rounded-lg my-2 bg-white select">
                            <option selected data-default>Select Game Access Level</option>
                            <option class="text-black">public</option>
                            <option class="text-black">private</option>
                        </select>
                    </div>

                    <input type="submit" value="Create Game" class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-green-600 to-green-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110" />
                </form>
                <h1 class="font-bold text-2xl mt-2">Join Game</h1>
                <form @submit.prevent="joinGame">
                    <input type="text" placeholder="Enter Game Code" v-model="joinForm.code">
                    <input type="submit" value="Join Game" class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-green-600 to-green-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110" />
                </form>
            </div>

            
            <hr class="my-5"/>

            <button @click="findGame" class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-blue-500 to-blue-300 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110">Find Game</button>
            <h1>Currently {{ gameLength }} public games available</h1>
            <table class="w-full table-fixed text-left" v-if="gameLength > 0">
                <tr style="border-bottom: 1px solid #C8C8C8;">
                    <th style="">Name</th>
                    <th>Code</th>
                    <th>Access</th>
                    <th>Status</th>
                </tr>
                <tr v-for="game in games" :key="game.Id">
                    <td>{{ game.Name }}</td>
                    <td>{{ game.Id }}</td>
                    <td>{{ game.Type }}</td>
                    <td><div><p class="float-left">{{ game.Status == "false" ? "open" : "closed" }}</p><NuxtLink class="float-right font-bold text-green-600" :to="'/app/game/' + game.Id">Join</NuxtLink></div></td>
                </tr>
            </table>

        </div>

    </div>
</template>


<script>


export default {
    data(){
        return {
            form: {
                name: "",
                type: "Select Game Access Level",
            },
            joinForm: {
                code: "",
            },
            games: [],
            spamProtection: {
                findGame: false,
                joinGame: false,
                createGame: false,
            }
        }
    },
    async fetch(){
        let result = (await this.$axios.get("https://d3jenk3g2s9tcm.cloudfront.net/game/all")).data
        if(result != null) this.games = result;
    },
    computed: {
        gameLength(){
            return this.games.length
        }
    },
    methods: {
        async createGame(){
            if(!this.spamProtection.createGame){            
                this.spamProtection.createGame = true;
                try{
                    if(this.form.name.length < 1){
                        alertify.alert("Error", "Game name must be at least 1 character long").set("movable", false);
                        this.spamProtection.createGame = false;
                        return;
                    }else if(this.form.type == "Select Game Access Level"){
                        alertify.alert("Error", "Please select a valid access level").set("movable", false);
                        this.spamProtection.createGame = false;
                        return;
                    }
                    let result = (await this.$axios.post("https://d3jenk3g2s9tcm.cloudfront.net/game/create", this.form, {headers: {'Content-Type': 'application/json'}})).data
                    this.spamProtection.createGame = false;
                    this.$router.push(`/app/game/${result["id"]}`)
                }catch (error){
                    alertify.alert("Error", error).set("movable", false);
                    this.spamProtection.createGame = false;
                }
            }
        },
        async joinGame(){
            if(!this.spamProtection.joinGame){
                this.spamProtection.joinGame = true;
                try{
                    let result = (await this.$axios.get(`https://d3jenk3g2s9tcm.cloudfront.net/game/verify?code=${this.joinForm.code}`, {headers: {'Content-Type': 'application/json'}})).data 
                    if(result["status"]){
                        this.spamProtection.joinGame = false;
                        this.$router.push(`/app/game/${this.joinForm.code}`)
                    }else{
                        alertify.alert("Error", "Not a valid room code").set("movable", false);
                        this.spamProtection.joinGame = false;
                    }
                }catch(error){
                    alertify.alert("Error", error).set("movable", false);
                    this.spamProtection.joinGame = false;
                }
            }           
        },
        async findGame(){
            if(!this.spamProtection.findGame){
                this.spamProtection.findGame = true;
                try{
                    let result = await this.$axios.get("https://d3jenk3g2s9tcm.cloudfront.net/game/find")
                    if (result.status == 204 || result.data.Id == undefined) {
                        alertify.alert("Error", 'No games found').set("movable", false);
                        this.spamProtection.findGame = false;
                    }else{
                        this.spamProtection.findGame = false;
                        this.$router.push(`/app/game/${result.data.Id}`)
                    }
                }catch(err) {
                    alertify.alert("Error", err).set("movable", false);
                    this.spamProtection.findGame = false;
                }
            }
        },
        async logout(){
            await this.$auth.logout();
            this.$router.push("/auth")
        }
    }

}
</script>

<style>
    .top-left{
        position: absolute;
        left: 100%;
        transform: translateX(-100%)
    }
    .center{
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
    }
    input[type=text], input[type=password], input[type=email] {
        width: 100%;
        padding: 12px 20px;
        margin: 8px 0;
        display: inline-block;
        border: 1px solid #ccc;
        border-radius: 0.5rem;
        box-sizing: border-box;
    }


    .top-center{
        position: absolute;
        left: 50%;
        top: 5%;
        transform: translate(-50%, 0);
    }

    .select{
        border: 1px solid #ccc;
    }
    select option[data-default] {
        color: #888;
    }
</style>