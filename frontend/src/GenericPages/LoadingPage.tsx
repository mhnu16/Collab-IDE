import logo from '/logo.svg'

export default function LoadingPage() {
    return (
        <div className='container'>
            <h1>Loading...</h1>
            <img src={logo} className="App-logo" alt="logo" />
        </div>
    )
}