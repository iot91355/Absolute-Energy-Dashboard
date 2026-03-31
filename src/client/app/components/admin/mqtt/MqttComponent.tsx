import * as React from 'react';
import { useState, useEffect } from 'react';
import { Form, FormGroup, Label, Input, Button, Spinner, Alert } from 'reactstrap';
import { titleStyle } from '../../../styles/modalStyle';
import TooltipHelpComponent from '../../TooltipHelpComponent';
import { toast } from 'react-toastify';

export default function MqttComponent() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [config, setConfig] = useState({
		broker_url: '',
		topic: '',
		client_id: '',
		username: '',
		password: '',
		filters: ''
	});

	useEffect(() => {
		fetchMqttConfig();
	}, []);

	const fetchMqttConfig = async () => {
		try {
			const res = await fetch('/api/mqtt');
			if (res.ok) {
				const data = await res.json();
				if (data) {
					setConfig(data);
				}
			}
		} catch (error) {
			console.error("Failed to fetch MQTT config:", error);
			toast.error("Failed to load MQTT configuration.");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setConfig(prev => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await fetch('/api/mqtt', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(config)
			});
			if (res.ok) {
				toast.success("MQTT configuration saved and client restarted.");
			} else {
				throw new Error("Failed to save.");
			}
		} catch (error) {
			toast.error("Error saving MQTT configuration.");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (!window.confirm("Are you sure you want to delete and stop the MQTT configuration?")) return;
		
		setSaving(true);
		try {
			const res = await fetch('/api/mqtt', { method: 'DELETE' });
			if (res.ok) {
				setConfig({
					broker_url: '',
					topic: '',
					client_id: '',
					username: '',
					password: '',
					filters: ''
				});
				toast.success("MQTT configuration deleted and client stopped.");
			} else {
				throw new Error("Failed to delete.");
			}
		} catch (error) {
			toast.error("Error deleting MQTT configuration.");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div>
			<TooltipHelpComponent page='admin' />
			<h2 style={titleStyle}>
				MQTT Configuration
			</h2>
			<div className='container-fluid'>
				<div className='row justify-content-center mt-4'>
					<div className='col-12 col-md-8 col-lg-6'>
						<div className="card p-4 shadow-sm">
							<p className="text-muted mb-4">
								Configure the MQTT broker, topic, and credentials. Only <b>one</b> MQTT connection is supported at a time.
							</p>
							{loading ? (
								<div className="text-center">
									<Spinner color="primary" />
								</div>
							) : (
								<Form onSubmit={handleSubmit}>
									<FormGroup>
										<Label for="broker_url">Broker URL</Label>
										<Input
											type="text"
											name="broker_url"
											id="broker_url"
											placeholder="e.g. mqtts://broker.hivemq.com:8883"
											value={config.broker_url || ''}
											onChange={handleChange}
											required
										/>
									</FormGroup>
									
									<FormGroup>
										<Label for="topic">Topic (e.g. devices/Device01/telemetry)</Label>
										<Input
											type="text"
											name="topic"
											id="topic"
											placeholder="#"
											value={config.topic || ''}
											onChange={handleChange}
											required
										/>
									</FormGroup>

									<FormGroup>
										<Label for="filters">Filters (comma-separated ignored prefixes)</Label>
										<Input
											type="text"
											name="filters"
											id="filters"
											placeholder="e.g. FlowMeter/, Delta_PLC/"
											value={config.filters || ''}
											onChange={handleChange}
										/>
										<small className="form-text text-muted">Meters matching these prefixes will NOT be stored.</small>
									</FormGroup>

									<FormGroup>
										<Label for="client_id">Client ID (optional)</Label>
										<Input
											type="text"
											name="client_id"
											id="client_id"
											placeholder="Leave blank for auto-generated ID"
											value={config.client_id || ''}
											onChange={handleChange}
										/>
									</FormGroup>

									<div className="row">
										<div className="col-md-6">
											<FormGroup>
												<Label for="username">Username (optional)</Label>
												<Input
													type="text"
													name="username"
													id="username"
													value={config.username || ''}
													onChange={handleChange}
												/>
											</FormGroup>
										</div>
										<div className="col-md-6">
											<FormGroup>
												<Label for="password">Password (optional)</Label>
												<Input
													type="text"
													name="password"
													id="password"
													value={config.password || ''}
													onChange={handleChange}
												/>
											</FormGroup>
										</div>
									</div>

									<div className="mt-4 d-flex justify-content-between">
										<Button type="submit" color="primary" disabled={saving}>
											{saving ? <Spinner size="sm" /> : 'Save & Restart Client'}
										</Button>
										<Button type="button" color="danger" onClick={handleDelete} disabled={saving}>
											Stop & Remove
										</Button>
									</div>
								</Form>
							)}
						</div>
					</div>
				</div>

				{/* ── Database Configuration ── */}
				<DatabaseConfig />
			</div>
		</div>
	);
}

function DatabaseConfig() {
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [dbConfig, setDbConfig] = useState({
		host: '',
		port: '5432',
		user: '',
		password: '',
		database: ''
	});

	useEffect(() => {
		fetch('/api/db-config')
			.then(r => r.json())
			.then(data => { setDbConfig(data); setLoading(false); })
			.catch(() => setLoading(false));
	}, []);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setDbConfig(prev => ({ ...prev, [name]: value }));
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await fetch('/api/db-config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(dbConfig)
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(data.message || 'Database config saved. Restart server to apply.');
			} else {
				throw new Error(data.error || 'Failed to save.');
			}
		} catch (err: any) {
			toast.error('Error saving database config: ' + err.message);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className='row justify-content-center mt-4 mb-4'>
			<div className='col-12 col-md-8 col-lg-6'>
				<div className="card p-4 shadow-sm">
					<h5 className="mb-1" style={{ fontWeight: 600 }}>Database Configuration</h5>
					<p className="text-muted mb-4" style={{ fontSize: '13px' }}>
						Override the database connection settings. Values are saved to <code>.env</code> and take effect on server restart.
						These replace the hardcoded values in <code>docker-compose.yml</code>.
					</p>
					{loading ? (
						<div className="text-center"><Spinner color="secondary" /></div>
					) : (
						<Form onSubmit={handleSave}>
							<div className="row">
								<div className="col-md-8">
									<FormGroup>
										<Label for="db_host">Host</Label>
										<Input
											type="text"
											name="host"
											id="db_host"
											placeholder="e.g. database (Docker) or localhost"
											value={dbConfig.host}
											onChange={handleChange}
											required
										/>
									</FormGroup>
								</div>
								<div className="col-md-4">
									<FormGroup>
										<Label for="db_port">Port</Label>
										<Input
											type="number"
											name="port"
											id="db_port"
											placeholder="5432"
											value={dbConfig.port}
											onChange={handleChange}
											required
										/>
									</FormGroup>
								</div>
							</div>

							<FormGroup>
								<Label for="db_database">Database Name</Label>
								<Input
									type="text"
									name="database"
									id="db_database"
									placeholder="e.g. oed"
									value={dbConfig.database}
									onChange={handleChange}
									required
								/>
							</FormGroup>

							<div className="row">
								<div className="col-md-6">
									<FormGroup>
										<Label for="db_user">Username</Label>
										<Input
											type="text"
											name="user"
											id="db_user"
											placeholder="e.g. oed"
											value={dbConfig.user}
											onChange={handleChange}
											required
										/>
									</FormGroup>
								</div>
								<div className="col-md-6">
									<FormGroup>
										<Label for="db_password">Password</Label>
										<Input
											type="password"
											name="password"
											id="db_password"
											value={dbConfig.password}
											onChange={handleChange}
										/>
									</FormGroup>
								</div>
							</div>

							<div className="mt-3 d-flex align-items-center gap-2">
								<Button type="submit" color="secondary" disabled={saving}>
									{saving ? <Spinner size="sm" /> : 'Save to .env'}
								</Button>
								<small className="text-muted ms-2">⚠️ Restart the server container after saving to apply changes.</small>
							</div>
						</Form>
					)}
				</div>
			</div>
		</div>
	);
}
