import React from 'react';
import { NavLink } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import covidforecastslogo from './COVIDforecasts-logo-white.png'
import './Navbar.css'

class Navbar extends React.Component {
  	constructor(props){
		super(props);
		this.state = { 
			loggedinstate: '', 
			logoutbutton: null, 
			loginbutton: null, 
			signupbutton: null,
		}
		this.isLoggedIn = this.isLoggedIn.bind(this)
	}

	/*
	isLoggedIn() {
		fetch('/user-status').then(res => res.json()).then(data => {
			this.setState({ users: data });
		});
	}*/

	componentDidMount() {
		console.log("nav bar loading");
		this.isLoggedIn();
		this.setState({'active': 'home'});
	}

	changeTab = (tabID) => {
		this.setState({'active': tabID});
		console.log("ACTIVE TAB");
		console.log(this.state.active);
	}

	async saveLogout() {
		fetch('/logout/',{
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}

	isLoggedIn = () => {
		fetch('/login-status/')
		.then((response) => response.json())
		.then((data) => this.setState({loggedinstate: data}));
	}


	renderDropdown(){
		if (this.state.loggedinstate['logged in']) {
			return (
				<div className='navbar-nav ml-auto dropleft'>
					<ul className="navbar-nav ml-auto">
						<li className="nav-item dropdown ml-auto">
							<a className="nav-link dropdown-toggle" href="#" id="navbardrop" data-toggle="dropdown">
								Hello {this.state.loggedinstate['name']}!
							</a>
							<div className="dropdown-menu dropdown-menu-left">
								<a className="dropdown-item" href={ROUTES.PROFILE}>My Predictions</a>
								<a className="dropdown-item" onClick={() => this.saveLogout()} href={ROUTES.LANDING}>Sign Out</a>
							</div>
						</li>
					</ul>
				</div>
			);
		}

		else {
			return (
				<div className='navbar-nav ml-auto dropleft'>
					<ul className="navbar-nav ml-auto">
						<li className="nav-item dropdown">
							<a className="nav-link dropdown-toggle" href="#" id="navbardrop" data-toggle="dropdown">Welcome</a>
							<div className="dropdown-menu">
								<a className="dropdown-item" href={ROUTES.SIGN_UP}>Sign Up</a>
								<a className="dropdown-item" href={ROUTES.SIGN_IN}>Sign In</a>
							</div>
						</li>
					</ul>
				</div>
			);
		}
	}


  	render() {
		return (
			<nav className="navbar navbar-expand-lg navbar-dark bg-dark">
				<a className="navbar-brand" href='/'>
					<img id='logo' src={covidforecastslogo} style={{width:450, marginTop: -10}}></img>
				</a>
				<button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
					<span className="navbar-toggler-icon"></span>
				</button>
				<div className="collapse navbar-collapse" id="navbarNavAltMarkup">
					<div className="navbar-nav">
						<NavLink exact activeClassName="active" className="nav-item nav-link" to={ROUTES.LANDING}>Home</NavLink>
						<NavLink exact activeClassName="active" className="nav-item nav-link" to={ROUTES.ABOUT}>About</NavLink>
						<NavLink exact activeClassName="active" className="nav-item nav-link" to={ROUTES.LEADERBOARD}>Top Forecasts</NavLink>
					</div>
					{this.renderDropdown()}
				</div>
			</nav>
		);
  	}
}

export default Navbar;
