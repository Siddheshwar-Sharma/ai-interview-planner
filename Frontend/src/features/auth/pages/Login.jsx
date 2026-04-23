import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom' // ✅ FIX
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            const res = await handleLogin({ email, password })

            if (res) {
                navigate('/')
            }

        } catch (err) {
            console.log("LOGIN ERROR:", err.response?.data)
            alert(err.response?.data?.message || "Login failed")
        }
    }

    if (loading) {
        return (<main><h1>Loading.......</h1></main>)
    }

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Email</label>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            placeholder='Enter email address'
                        />
                    </div>

                    <div className="input-group">
                        <label>Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            placeholder='Enter password'
                        />
                    </div>

                    <button className='button primary-button'>Login</button>
                </form>

                <p>Don't have an account? <Link to={"/register"}>Register</Link></p>
            </div>
        </main>
    )
}

export default Login