import React, { Component } from 'react';

export default class FilesUploadComponent extends Component {
    render() {
        return (
            <div className="container">
                <div className="row">
                    <form>
                        <h3>React File Upload</h3>
                        <div className="form-group">
                            <input type="file" />
                        </div>
                        <div className="form-group">
                            <button className="btn btn-primary" type="submit">Upload</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}

//import FilesUploadComponent from './components/files-upload-component';

class App extends Component {
  render() {
    return (
      <div className="App">
        <FilesUploadComponent />
      </div>
    );
  }
}


ReactDOM.render(
    <App />,
    document.getElementById('App')
);

//export default App;