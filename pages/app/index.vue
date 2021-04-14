<template>
    <div>
        <form @submit.prevent="createGame">
            <input type="text" placeholder="Game Name" v-model="form.name">
            <input type="submit" value="Create Game" />
        </form>
    </div>
</template>


<script>
export default {
    data(){
        return {
            form: {
                name: ""
            }
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
        }
    }

}
</script>
