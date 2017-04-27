import React, { Component } from 'react';
import { Button, Row, Input, Pagination} from 'react-materialize';

class ProfileForm extends Component {
  componentDidMount() {
    this.props.getUser(this.props.user).then((res) => {
      this.setState({
        firstName: res.data.user.firstName,
        lastName: res.data.user.lastName,
        username: res.data.user.username,
        email: res.data.user.email,
        password: res.data.user.password
      });
    });
  }
  /**
   * renders the ProfileForm component
   * @returns {void}
   * @memberOf ProfileForm
   */
  constructor(props) {
    super(props);
    this.state = {
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: ''
    };
    this.onChange = this.onChange.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  onChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  onSubmit(event) {
    event.preventDefault();
    this.props.updateUser(this.state, this.props.user);
  }

  render() {
    return (
      <div>
        <form className="col s12" method="post" onSubmit={(e) => this.onSubmit(e)}>
          <Row>
            <Input
              s={6}
              value="FirstName:"
            />
            <Input
              s={6}
              name="firstName"
              value={this.state.firstName}
              onChange={(event) => this.onChange(event)}
              required
            />
          </Row>
          <Row>
            <Input
              s={6}
              value="LastName:"
            />
            <Input
              s={6}
              name="lastName"
              value={this.state.lastName}
              onChange={(event) => this.onChange(event)}
              required
            />
          </Row>
          <Row>
            <Input
              s={6}
              value="Username:"
            />
            <Input
              s={6}
              name="username"
              value={this.state.username}
              onChange={(event) => this.onChange(event)}
              required
            />
          </Row>
          <Row>
            <Input
              s={6}
              value="Email:"
            />
            <Input
              s={6}
              name="email"
              value={this.state.email}
              onChange={(event) => this.onChange(event)}
              required
            />
          </Row>
          <Row>
            <Input
              s={6}
              value="New Password:"
            />
            <Input
              s={6}
              name="password"
              type="password"
              value={this.state.password}
              onChange={event => this.onChange(event)}
              required
            />
          </Row>
          <Button className="" waves="light" type="submit">
            UPDATE
          </Button>
        </form>
      </div>
    );
  }
}

ProfileForm.propTypes = {
  user: React.PropTypes.number.isRequired,
  getUser: React.PropTypes.func.isRequired
};

ProfileForm.contextTypes = {
  router: React.PropTypes.object.isRequired
};

export default ProfileForm;
