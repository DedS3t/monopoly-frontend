<template>
    <div>
    <form @submit.prevent="submitLogin">
        <h1>login</h1>
        <input type="email" name="email" v-model="loginForm.email" placeholder="Email" />
        <input type="password" name="pass" v-model="loginForm.pass" placeholder="Password" />
        <input type="submit" />
    </form>
        <form @submit.prevent="submitSignup">
        <h1>Signup</h1>
        <input type="email" name="email" v-model="signupForm.email" placeholder="Email" />
        <input type="password" name="pass" v-model="signupForm.pass" placeholder="Password" />
        <input type="submit" />
    </form>
    </div>
</template>

<script>
export default {
    data(){
        return {
            loginForm: {
                email: '',
                pass: ''
            },
            signupForm: {
                email: '',
                pass: ''
            }
        }
    },
    methods: {
        async submitLogin(){
            try{
                let result = await this.$auth.loginWith('local', { data: this.loginForm });
                this.$router.push("/app/")
            }catch (error){
                console.log(error)
            }
        },
        async submitSignup(){
            try{
                await this.$axios.post('http://localhost:3333/user/create', this.signupForm, {
                    headers: {
                    'Content-Type': 'application/json'
                    }
                });
                let result = await this.$auth.loginWith('local', { data: this.signupForm });
                this.$router.push("/app/")

            }catch (error){
                console.log(error)
            }
        }
    }
}
</script>

