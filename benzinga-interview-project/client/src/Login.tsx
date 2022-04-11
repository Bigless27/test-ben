import React from 'react'
import { withFormik, Form, Field } from 'formik'
import './Login.scss';
import { GetManager } from '@benzinga/data'

interface IProps {
    email: string,
    password: string
}

const LoginPage = (props: IProps) => {
    const loginPageStyle = {
        margin: "32px auto 37px",
        maxWidth: "530px",
        background: "#fff",
        padding: "30px",
        borderRadius: "10px",
        boxShadow: "0px 0px 10px 10px rgba(0,0,0,0.15)"
    }

    return (
        <>
            <div className="container">
                <div className="login-wrapper" style={loginPageStyle}>
                    <h2>Login Page</h2>
                    <Form className="form-container">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <Field type="text" name="email" className={"form-control"} placeholder="Email" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <Field type="password" name="password" className={"form-control"} placeholder="Password" />
                        </div>
                        <button type="submit" className="btn btn-primary">Login</button>
                    </Form>
                </div>
            </div>
        </>
    )
}

const LoginFormik = withFormik({
    mapPropsToValues: (props: IProps) => {
        return {
            email: props.email || '',
            password: props.password || ''
        }
    },
    handleSubmit: async (values) => {
        let auth = GetManager('authentication');
        const login = await auth.login(values.email, values.password)
        if (login.err) {
            console.log(`Error: `, login.err);
        } else {
            console.log(`Authentication: `, login.result);
        }
    }
})(LoginPage)

export default LoginFormik