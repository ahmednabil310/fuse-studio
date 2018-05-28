import React, { Component } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import classNames from 'classnames'
import Link from 'react-router-dom/Link'
import { isMobile, MobileView } from 'react-device-detect'
import * as uiActions from 'actions/ui'
import { getClnToken } from 'selectors/basicToken'
import { formatAmount, formatMoney } from 'services/global'

import { LOGIN_MODAL } from 'constants/uiConstants'

import ClnIcon from 'images/cln.png'
import MenuIcon from 'images/menu.png'
import ProfileIcon from 'images/profile.png'
import ClnCoinIcon from 'images/cln-coin.png'

class TopNav extends Component {
	state = {
		openMenu: false
	}
	onClickMenu = () => {
		this.setState({
			openMenu: !this.state.openMenu
		})
	}
	showConnectMetamask() {
		if (!this.props.web3.isMetaMask) {
			this.props.uiActions.loadModal(LOGIN_MODAL);
		} else if (!this.props.web3.isAccountUnlocked) {
			this.props.uiActions.loadModal(LOGIN_MODAL);
		}
  	}
  	showContactUs() {
  		if (this.props.history.location.pathname === '/view/contact-us') {
  			this.props.history.replace('/view/contact-us')
  		} else {
  			this.props.history.push('/view/contact-us')
  		}
  		
  	}
	render() {
		let topNavClass = classNames({
			"active": this.props.active,
			"top-navigator": true
		})
		let navLinksClass = classNames({
			"hide": !this.state.openMenu && isMobile,
			"top-nav-links": true
		})

		return <div className={topNavClass}>
			<img src={ClnIcon}/>

			<div className={navLinksClass}>
				<a className="top-nav-text">Whitepaper</a>
				<div className="separator"/>
				<a className="top-nav-text">Q&A</a>
				<div className="separator"/>
				<div onClick={this.showContactUs.bind(this)} >
					<div className="top-nav-text">Contact us</div>
				</div>
				<div className="separator"/>
				<div className="separator-vertical"/>
				<div className="top-nav-text" onClick={this.showConnectMetamask.bind(this)}>
					<img src={ProfileIcon} />
					<span>{this.props.web3.account || 'Disconnected'}</span>
				</div>
				{this.props.web3.account ? <div className="top-nav-balance">
					<span>Balance:</span>
					<img src={ClnCoinIcon} />
					<span className="balance-text">{this.props.clnToken && this.props.clnToken.balanceOf && formatMoney(formatAmount(this.props.clnToken.balanceOf, 18), 2, '.', ',')}</span>
				</div> : null}
				<div className="separator"/>
			</div>

			<MobileView device={isMobile}>
				<img src={MenuIcon} className="mobile-menu-icon" onClick={this.onClickMenu}/>
			</MobileView>
		</div>
	}
}

const mapStateToProps = state => {
	return {
		web3: state.web3,
		clnToken: getClnToken(state)
	}
}
const mapDispatchToProps = dispatch => {
    return {
        uiActions: bindActionCreators(uiActions, dispatch),
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(TopNav)