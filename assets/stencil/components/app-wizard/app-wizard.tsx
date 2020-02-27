import { Component, State, h, Listen } from '@stencil/core';

import { login, signup, SignupForm, LoginForm } from '../../util/auth';

const TEMPLATES = [
  { name: 'Tabs', id: 'tabs' },
  { name: 'Menu', id: 'sidemenu' },
  { name: 'List', id: 'list' },
];

const FRAMEWORKS = [
  { name: 'Angular', id: 'angular' },
  { name: 'React', id: 'react' },
  { name: 'Vue (beta)', id: 'vue' },
]

const THEMES = [
  '#3880FF', // blue
  '#6030FF', // purple
  '#43C465', // green
  '#F2C526', // yellow
  '#F65E3C' // red
]
const r = Math.floor(Math.random() * 10000);

declare var window: any;

@Component({
  tag: 'ionic-app-wizard',
  styleUrl: 'app-wizard.scss',
  shadow: false
})
export class AppWizard {
  STEPS = [
    {
      name: 'Basics',
      id: 'basics'
    },
    {
      name: 'Configure',
      id: 'configure'
    },
    {
      name: 'Account',
      id: 'account'
    },
    {
      name: 'Finish',
      id: 'finish'
    }
  ]

  @State() step = 0;

  @State() showSignup = true;
  @State() signupErrors = null;
  @State() loginErrors = null;

  // The current appId from the server
  appId: string;

  // Color picker ref
  colorPickerRef: HTMLInputElement;

  // Form state
  @State() authenticating = false;
  @State() theme = THEMES[0];
  @State() email = '';
  @State() appName = '';
  @State() framework = 'angular';
  @State() template = 'tabs';
  @State() bundleId = 'com.supercool.ionic';
  @State() appUrl = 'http://example.com/';
  /*
  @State() authorEmail = 'max@ionic.io';
  @State() authorName = 'Max';
  */

  @State() loginForm: LoginForm = {
    email: 'max+1000@ionic.io'
  };
  @State() signupForm: SignupForm = {
    name: 'Mr Max',
    email: `max+${r}@ionic.io`,
    username: `maxtest-${r}`,
  };

  @Listen('popstate', { target: 'window' })
  handlePopState(e) {
    if (e.state) {
      const step = e.state.step;
      if (step) {
        this.step = step;
        return;
      }
    }

    this.step = 0;
  }

  setStep = (step) => {
    this.step = step;
    history.pushState({ step: this.step }, null, `#${this.STEPS[this.step].id}`);
  }

  next = (e) => {
    e.preventDefault();
    this.setStep(this.step + 1 % this.STEPS.length);
  }

  login = async (e) => {
    e.preventDefault();

    try {
      this.authenticating = true;
      const ret = await login(this.loginForm.email, this.loginForm.password, 'start-wizard');
      this.email = this.loginForm.email;
      this.authenticating = false;
    } catch (e) {
      this.authenticating = false;
      this.loginErrors = e;
      return;
    }

    return this.finish();
  }

  signup = async (e) => {
    e.preventDefault();
    try {
      this.authenticating = true;
      await signup(this.signupForm);
      this.email = this.loginForm.email;
      this.authenticating = false;
    } catch (e) {
      this.authenticating = false;
      this.signupErrors = e;
      return;
    }

    return this.finish();
  }

  finish = async () => {
    try {
      await this.save();
      this.setStep(this.STEPS.length - 1);
    } catch (e) {
      alert('Unable to create app, please start over!');
      this.step = 0;
    }
  }

  save = async () => {
    const res = await fetch('/api/v1/wizard/create', {
      body: JSON.stringify({
        type: this.framework,
        'package-id': this.bundleId,
        tid: this.getHubspotId(),
        atk: this.getToken(),
        email: this.email,
        appId: this.appId,
        template: this.template,
        name: this.appName,
        theme: this.theme
        /*
        'app-url': this.appUrl,
        'author-name': this.authorName,
        'author-email': this.authorEmail
        */
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();
    this.appId = data.appId;
    return data;
  }

  getApp = async () => {
    const res = await fetch(`/api/v1/wizard/app/${this.getHubspotId()}`);

    return await res.json();
  }

  getHubspotId = () => {
    return window.getCookie('hubspotutk');
  }

  getToken = () => {
    return window.getCookie('_ionic_token');
  }

  handleChangeStep = (e) => {
    const step = parseInt(e.detail.value, 10);
    if (step !== this.step) {
      this.setStep(step);
    }
  }

  handlePickTheme = (e) => {
    this.colorPickerRef && this.colorPickerRef.click();
  }

  handleInput = (fieldName) => e => {
    this[fieldName] = e.target.value;
  };

  renderBasics() {
    return (
      <div>
        <hgroup>
          <h2>Welcome to Ionic</h2>
          <h4>Let's start your first app</h4>
        </hgroup>
        <form class="form" onSubmit={this.next}>
          <input
            type="color"
            class="color-picker"
            ref={e => this.colorPickerRef = e}
            value={this.theme}
            onInput={(e: any) => this.theme = e.currentTarget.value }
            />
          <div class="form-group" id="field-appname">
            <label htmlFor="id_appname">App name</label>
            <input type="text" id="id_appname" name="appname" value={this.appName} tabindex="1" required onInput={this.handleInput('appName')} />
            <div class="form-message form-message--small"></div>
          </div>
          <label>Pick a template</label>
          <ThemePicker
            value={this.theme}
            onChange={(theme) => this.theme = theme}
            onPick={this.handlePickTheme}
          />
          <div class="form-group" id="field-appname">
            <label>Pick a template</label>
            <TemplateSwitcher
              value={this.template}
              onChange={tmpl => this.template = tmpl} />
          </div>
          <div class="form-group" id="field-appname">
            <label>JavaScript Framework</label>
            <FrameworkSwitcher
              value={this.framework}
              onChange={framework => this.framework = framework} />
          </div>
          <Button>Next</Button>
        </form>
      </div>
    )
  }

  renderConfigure() {
    return (
      <div>
        <hgroup>
          <h2>Configure {this.appName}</h2>
          <h4>Some extra information needed to correctly build native apps</h4>
        </hgroup>
        <form class="form" onSubmit={this.next}>
          <div class="form-group" id="field-appurl">
            <label htmlFor="id_appurl">Company or App URL</label>
            <input type="text" id="id_appurl" name="appurl" value={this.appUrl} tabindex="1" onInput={this.handleInput('appUrl')} />
            <div class="form-message form-message--small"></div>
          </div>
          <div class="form-group" id="field-bundleid">
            <label htmlFor="id_bundleid">Bundle ID</label>
            <input type="text" id="id_bundleid" name="bundleid" value={this.bundleId} tabindex="1" onInput={this.handleInput('bundleId')} />
            <div class="form-message form-message--small"></div>
          </div>
          {/*
          <div class="form-group" id="field-authoremail">
            <label htmlFor="id_authoremail">Author Email</label>
            <input type="text" id="id_authoremail" name="authoremail" value={this.authorEmail} tabindex="1" onInput={this.handleInput('authorEmail')} />
            <div class="form-message form-message--small"></div>
          </div>
          <div class="form-group" id="field-authorname">
            <label htmlFor="id_authorname">Author Name</label>
            <input type="text" id="id_authorname" name="authorname" value={this.authorName} tabindex="1" onInput={this.handleInput('authorName')}/>
            <div class="form-message form-message--small"></div>
          </div>
          */}
          <Button>Next</Button>
        </form>
      </div>
    )
  }

  renderAccount() {
    if (this.email) {
      return (
        <div>
          <hgroup>
            <h2>Create your Ionic account</h2>
            <h4>Get access to the Ionic Forum and Appflow</h4>
          </hgroup>
          <div class="logged-in">
            <p>
              Logged in as {this.email}
            </p>
            <form onSubmit={e => { e.preventDefault(); this.finish() }}>
              <Button>Finish</Button>
            </form>
          </div>
        </div>
      )
    }
    return (
      <div>
        <hgroup>
          <h2>Create your Ionic account</h2>
          <h4>Build, connect, and ship your app even faster</h4>
        </hgroup>
        { this.showSignup ? (
        <SignupForm
          handleSubmit={this.signup}
          disable={this.authenticating}
          errors={this.signupErrors}
          form={this.signupForm}
          loginInstead={() => this.showSignup = false}
          inputChange={(name) => e => this.signupForm[name] = e.target.value}
          />
        ) : (
        <LoginForm
          handleSubmit={this.login}
          disable={this.authenticating}
          errors={this.loginErrors}
          signupInstead={() => this.showSignup = true}
          form={this.loginForm}
          inputChange={(name) => e => this.loginForm[name] = e.target.value}
          />
        )}
      </div>
    );
  }

  renderFinish() {
    const instructions = `
npm install -g @ionic/cli
ionic start --start-id ${this.appId}
    `;
    return (
      <div class="finish">
        <header>
          <span class="icon">🎉</span>
          <h3>Your app is ready to go!</h3>
        </header>
        <p>
          Run this command to start building:
        </p>
        <div>
          <pre><code>{instructions}</code></pre>
        </div>
        <div>
          <small>Note: this command will expire in two hours. Dive deeper with the <a href="https://ionicframework.com/docs">documentation</a></small>
        </div>

      </div>
    )
  }

  renderStep() {
    switch (this.step) {
      case 0: return this.renderBasics();
      case 1: return this.renderConfigure();
      case 2: return this.renderAccount();
      case 3: return this.renderFinish();
    }
  }

  render() {
    return (
      <div id="app-wizard">
        {this.step < 3 ? (
        <Switcher
          items={this.STEPS.slice(0, 3).map(s => s.name)}
          index={this.step}
          onChange={this.handleChangeStep}
          />
        ) : null}
        {this.renderStep()}
      </div>
    );
  }
}

const Button = (_props, children) => (
  <button type="submit" id="submit" class="btn btn-block">{ children }</button>
);

const ThemePicker = ({ value, onChange, onPick }) => {
  const themes = [
    ...THEMES,
    !THEMES.find(t => t === value) ? value : null
  ].filter(t => !!t);

  return (
    <div class="themes">
    {themes.map(t => (
      <div
        key={t}
        class={`theme ${value === t ? 'selected' : ''}`}
        onClick={() => onChange(t)}>
          <div class="theme-color" style={{ backgroundColor: t }} />
      </div>
    ))}
      <div class="theme pick-theme" onClick={() => onPick()}>
        <ion-icon name="md-color-filter" />
      </div>
    </div>
  )
}

const FrameworkSwitcher = ({ value, onChange }) => (
  <div class="frameworks">
  {FRAMEWORKS.map(f => (
    <div key={f.id} class={`framework ${value === f.id ? 'selected' : ''}`} onClick={() => onChange(f.id)}>
      <h5>{f.name}</h5>
    </div>
  ))}
  </div>
);

const TemplateSwitcher = ({ value, onChange }) => (
  <div class="templates">
  {TEMPLATES.map(f => (
    <div key={f.id} class={`template ${value === f.id ? 'selected' : ''}`} onClick={() => onChange(f.id)}>
      <h5>{f.name}</h5>
    </div>
  ))}
  </div>
);

const Switcher = ({ items, index, onChange }) => (
  <ion-segment class="switcher" value={index} onIonChange={onChange}>
    {items.map((item, i) => (
      <ion-segment-button key={item} value={i} class="switcher-button">{item}</ion-segment-button>
    ))}
  </ion-segment>
);

interface SignupFormProps {
  form: SignupForm;
  handleSubmit: (e) => Promise<void>;
  errors: any;
  disable: boolean;
  loginInstead: () => void;
  inputChange: (name: string) => (e: any) => void;
}
const SignupForm = ({ form, handleSubmit, errors, disable, loginInstead, inputChange }: SignupFormProps) => (
  <form class="form" id="signup-form" role="form" onSubmit={handleSubmit} method="POST">
    { errors ? (
    <div class="errorlist">
      <div>Unable to create account.</div>
      <div class="form-message">{errors.message}</div>
    </div>
    ) : null }
    <div class="form-group" id="field-name">
      <label>Full name</label>
      <input
        type="text"
        id="id_name"
        name="name"
        tabindex="1"
        required
        value={form.name}
        disabled={disable}
        onInput={inputChange('name')}
        />
      <div class="form-message form-message--small"></div>
    </div>
    <div class="form-group" id="field-email">
      <label>Email</label>
      <input
        type="text"
        id="id_email"
        name="email"
        tabindex="2"
        required
        value={form.email}
        disabled={disable}
        onInput={inputChange('email')}
        />
      <div class="form-message form-message--small"></div>
    </div>
    <div class="form-group" id="field-username">
      <label>Username</label>
      <input
        type="text"
        id="id_username"
        name="username"
        tabindex="3"
        required
        value={form.username}
        disabled={disable}
        onInput={inputChange('username')}
        />
      <div class="form-message form-message--small"></div>
    </div>
    <div class="form-group" id="field-password">
      <label>Password</label>
      <input
        type="password"
        id="id_password"
        name="password"
        tabindex="4"
        required
        value={form.password}
        disabled={disable}
        onInput={inputChange('password')}
        />
      <div class="form-message form-message--small"></div>
    </div>
    <div class="form-group">
    <span class="disclaimer">By signing up you agree to our <a target="_blank" href="/tos">Terms of Service</a> and <a target="_blank" href="/privacy">Privacy Policy</a></span>
    </div>
    <button
      type="submit"
      id="submit"
      class="btn btn-block"
      disabled={disable}
      tabindex="5">Create free account</button>
    <div class="well">
      Already have an account? <a href="#" class="text-link" onClick={e => { e.preventDefault(); loginInstead() }}>Log in</a>
    </div>
  </form>
)

interface LoginFormProps {
  form: LoginForm;
  handleSubmit: (e) => Promise<void>;
  errors: any;
  disable: boolean;
  signupInstead: () => void;
  inputChange: (name: string) => (e: any) => void;
}
const LoginForm = ({ form, disable, handleSubmit, errors, signupInstead, inputChange }: LoginFormProps) => (
  <form class="form" id="login-form" role="form" onSubmit={handleSubmit} method="POST">
    { errors ? (
    <div class="errorlist">
      <div>Unable to log in:</div>
      <div class="form-message">{errors.message}</div>
    </div>
    ) : null }
    <div class="form-group" id="field-email">
      <label htmlFor="id_email">Email</label>
      <input
        type="text"
        id="id_email"
        name="email"
        autocomplete="username"
        tabindex="1"
        required
        value={form.email}
        disabled={disable}
        onInput={inputChange('email')} />
      <div class="form-message form-message--small"></div>
    </div>
    <div class="form-group" id="field-password">
      <label htmlFor="id_password">
        Password
        <div class="forgot-password">
          <a target="_blank" href="https://dashboard.ionicframework.com/reset-password" title="Reset Password?">Forgot password?</a>
        </div>
      </label>
      <input
        type="password"
        id="id_password"
        name="password"
        autocomplete="current-password"
        tabindex="2"
        required
        value={form.password}
        disabled={disable}
        onInput={inputChange('password')} />
      <div class="form-message form-message--small"></div>
    </div>
    <button
      type="submit"
      id="submit"
      class="btn btn-block"
      disabled={disable}
      tabindex="3">
        Log in
    </button>
    <div class="well">
      Don't have an account? <a class="text-link" href="#" onClick={(e) => { e.preventDefault(); signupInstead() }}>Sign up</a>
    </div>
  </form>
)