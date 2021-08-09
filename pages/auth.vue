<template>
    <div>
        <form class="form" @submit.prevent="submitLogin" v-if="active == 'login'">
            <h1 class="font-bold text-3xl">Login</h1>
            <input type="text" name="email" v-model="loginForm.email" placeholder="Username" />
            <input type="password" name="pass" v-model="loginForm.pass" placeholder="Password" />
            <div class="w-full">
                <a @click="active = 'signup'" class="link">Don't have an account? Signup</a>
            </div>
            <input  class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-green-600 to-green-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110" type="submit" />
        </form>
        <form class="form" @submit.prevent="submitSignup" v-if="active == 'signup'">
            <h1 class="font-bold text-3xl">Signup</h1>
            <input type="text" name="email" v-model="signupForm.email" placeholder="Username" />
            <input type="password" name="pass" v-model="signupForm.pass" placeholder="Password" />
            <div class="w-full">
                <a @click="active = 'login'" class="link">Already have an account? Login</a>
            </div>
            <input class="px-5 text-white py-2 text-xl rounded-lg bg-gradient-to-b border-2 from-green-600 to-green-400 transition delay-100 duration-500 ease-in-out transform hover:-translate-y-1 hover:scale-110" type="submit" />
        </form>
    </div>
</template>

<script>
export default {
    data(){
        return {
            active: 'login',
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
                await this.$auth.loginWith('local', { data: this.loginForm });
                
                if (this.$route.query.game) this.$router.push(`/app/game/${this.$route.query.game}`)
                else this.$router.push("/app/")
            }catch (error){
                console.log(error)
                alertify.alert("Error", "Login Failed").set("movable", false);
            }
        },
        async submitSignup(){
            try{
                await this.$axios.post('https://d3jenk3g2s9tcm.cloudfront.net/user/create', this.signupForm, {
                    headers: {
                    'Content-Type': 'application/json'
                    }
                });
                await this.$auth.loginWith('local', { data: this.signupForm });

                if (this.$route.query.game) this.$router.push(`/app/game/${this.$route.query.game}`)
                else this.$router.push("/app/")

            }catch (error){
                console.log(error)
                alertify.alert("Error", "Signup Failed").set("movable", false);
            }
        }
    }
}
</script>

<style scoped>
    .form{
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
    }
    input[type=text], input[type=password], input[type=email] {
        width: 100%;
        padding: 12px 20px;
        margin: 8px 0;
        display: inline-block;
        border: 1px solid #ccc;
        box-sizing: border-box;
    }
    .link{
        font-weight: 300;
    }
</style>

