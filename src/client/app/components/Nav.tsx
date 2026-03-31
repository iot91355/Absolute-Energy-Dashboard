import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectDisplayTitle } from '../redux/slices/adminSlice';
import { selectTheme, toggleTheme } from '../redux/slices/appStateSlice';
import './dashboard.css';

// eslint-disable-next-line jsdoc/require-param-description
export default function Nav({ style }: { style?: React.CSSProperties }) {
	const dispatch = useAppDispatch();
	const location = useLocation();
	const [currentDate, setCurrentDate] = useState('');
	const [notificationOpen, setNotificationOpen] = useState(false);
	const siteTitle = useAppSelector(selectDisplayTitle);
	const theme = useAppSelector(selectTheme);

	const getPageTitle = () => {
		if (location.pathname === '/charts') {
			return 'Graphs';
		}
		// Default to site title or Dashboard
		return siteTitle || 'Dashboard';
	};

	useEffect(() => {
		const updateDate = () => {
			const date = new Date();
			const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
			setCurrentDate(date.toLocaleDateString(undefined, options));
		};
		updateDate();
		const timer = setInterval(updateDate, 60000);
		return () => clearInterval(timer);
	}, []);

	const handleThemeToggle = () => {
		dispatch(toggleTheme());
	};

	return (
		<nav style={style}>
			<div className="nav-left">
				<div className="nav-greetings">
					<h2 className="page">{getPageTitle()}</h2>
					<h1 className="date">{currentDate}</h1>
				</div>
			</div>
			<div className="nav-right">
				<div className="theme-mode" style={{ cursor: 'pointer' }} onClick={handleThemeToggle}>
					<span className="material-symbols-rounded">
						{theme === 'light' ? 'sunny' : 'dark_mode'}
					</span>
					<span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
				</div>
				<div className="notification" style={{ cursor: 'pointer' }} onClick={() => setNotificationOpen(true)}>
					<span className="material-symbols-rounded">notifications</span>
				</div>
			</div>

			{/* Notification Side Menu Overlays */}
			{notificationOpen && (
				<div 
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						width: '100vw',
						height: '100vh',
						background: 'rgba(0,0,0,0.3)',
						zIndex: 9998,
						transition: 'opacity 0.3s ease'
					}}
					onClick={() => setNotificationOpen(false)}
				/>
			)}
			<div 
				style={{
					position: 'fixed',
					top: 0,
					right: notificationOpen ? 0 : '-400px',
					width: '350px',
					height: '100vh',
					backgroundColor: 'var(--card-bg, #ffffff)',
					boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
					transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					zIndex: 9999,
					padding: '24px',
					display: 'flex',
					flexDirection: 'column'
				}}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--divider-color, #e5e7eb)' }}>
					<h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: 'var(--text-value, #111827)' }}>Notifications</h3>
					<span className="material-symbols-rounded" style={{ cursor: 'pointer', color: 'var(--text-label, #6b7280)', padding: '4px', borderRadius: '50%' }} onClick={() => setNotificationOpen(false)}>close</span>
				</div>
				
				<div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
					{/* Example Notifications */}
					<div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-border, #f9fafb)', border: '1px solid var(--divider-color, #e5e7eb)' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<span className="material-symbols-rounded" style={{ color: '#3b5bfe', fontSize: '20px' }}>login</span>
							<p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-value, #111827)' }}>Admin Login</p>
						</div>
						<p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-label, #4b5563)', lineHeight: '1.4' }}>Admin user successfully logged into the system.</p>
						<span style={{ fontSize: '11px', color: 'var(--text-label, #9ca3af)' }}>Just now</span>
					</div>

					<div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-border, #f9fafb)', border: '1px solid var(--divider-color, #e5e7eb)' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<span className="material-symbols-rounded" style={{ color: '#10b981', fontSize: '20px' }}>settings</span>
							<p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-value, #111827)' }}>Settings Updated</p>
						</div>
						<p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-label, #4b5563)', lineHeight: '1.4' }}>Tariff rate configuration changes were saved.</p>
						<span style={{ fontSize: '11px', color: 'var(--text-label, #9ca3af)' }}>2 hours ago</span>
					</div>
					
					<div style={{ padding: '16px', borderRadius: '12px', background: 'var(--card-border, #f9fafb)', border: '1px solid var(--divider-color, #e5e7eb)' }}>
						<div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
							<span className="material-symbols-rounded" style={{ color: '#f59e0b', fontSize: '20px' }}>device_hub</span>
							<p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: 'var(--text-value, #111827)' }}>MQTT Reconnected</p>
						</div>
						<p style={{ margin: '0 0 8px 0', fontSize: '13px', color: 'var(--text-label, #4b5563)', lineHeight: '1.4' }}>MQTT Broker connection established successfully.</p>
						<span style={{ fontSize: '11px', color: 'var(--text-label, #9ca3af)' }}>Yesterday</span>
					</div>
				</div>
			</div>
		</nav>
	);
}