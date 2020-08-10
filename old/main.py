from flask import Flask, render_template, request, redirect, url_for, flash, session
from flask_pymongo import PyMongo
from pymongo import MongoClient, DESCENDING
from passlib.hash import pbkdf2_sha256
from datetime import timedelta, date
from bson.json_util import dumps, loads
import json
#import json
#import pandas as pd
from get_estimates import get_forecasts, get_accuracy_for_all_models, get_daily_confirmed_df, get_daily_forecasts
from confirmed import get_us_new_deaths, get_us_confirmed
from gaussian import get_gaussian_for_all


app = Flask(__name__)
app.secret_key = "super secret key"
app.permanent_session_lifetime = timedelta(days=7)

#us_cum_forecasts = get_forecasts()
#us_cum_confirmed = get_us_confirmed()
#us_inc_forecasts = get_daily_forecasts()
#us_inc_confirmed = get_us_new_deaths()

# set up pymongo
#app.config["MONGO_URI"] = "mongodb://localhost:27017/covid19-forecast"
app.config['MONGO_URI'] = "mongodb+srv://test:test@cluster0-3qghj.mongodb.net/covid19-forecast?retryWrites=true&w=majority"
mongo = PyMongo(app)

data = {}

# methods for authentication and registration
def store_session(id, name, username):
    session['id'] = str(id)
    session['name'] = name
    session['username'] = username

def authenticate(username, password):
    user = mongo.db.users.find_one(
        {"username": username})

    if user:
        if pbkdf2_sha256.verify(password, user["password"]):
            store_session((user['_id']), user['name'], user['username'])
            return True
    return False

def register(name, username, password):
    user = mongo.db.users.find_one(
        {"username": username})
    # user already exists
    if user:
        return False
    # add new user
    hashed = pbkdf2_sha256.hash(password)
    mongo.db.users.insert_one({
        'name': name,
        'username': username,
        'password': hashed,
        'score': 0
    })
    new_user = mongo.db.users.find_one({'username': username})
    store_session((new_user['_id']),
                  new_user['name'], new_user['username'])
    return True

def add_vote(id, pred_model):
    vote = mongo.db.votes.find_one(
        {"user_id": id})
    # user already voted
    if vote:
        #print(vote)
        # edit old_vote
        mongo.db.votes.update_one({"user_id": id}, 
        {'$set': 
            { "prediction_model": pred_model, "date":str(date.today()) }
        })
        #vote['prediction_model'] = pred_model
        #vote['date'] = str(date.today())
    else: 
        mongo.db.votes.insert_one({
            'user_id': id,
            'prediction_model': pred_model,
            'date': str(date.today())
        })

def fetch_votes(pred_model):
    #check if valid arg
    return mongo.db.votes.count({'prediction_model':pred_model})

def get_score(pred_model):
    #(pred_model)
    if pred_model == "Columbia":
        #print('correct')
        return 50
    else:
        #print('incorrect')
        return 0

def update_score(username, score):
    mongo.db.users.update_one({"username": username}, 
        {'$inc': 
            { "score": score }
        })
    #print("score updated")

#data: a list containing predicted number of deaths
def update_user_prediction(username, model, data, category, a=None, higher=False, index=None):
    #Get gaussian bump
    if category == "daily":
        print("get gaussian")
        print(data)
        data = get_gaussian_for_all(data, a, index, higher)
        print(data)
    pred = mongo.db.predictions.find_one({"username": username, "category": category, "model": model})
    #print(pred)
    if pred:
        #print("already exists")
        mongo.db.predictions.update_one({"username": username, "category": category, "model": model}, 
        {'$set': 
            { "prediction": data }
        })
    else:
        mongo.db.predictions.insert_one({"username": username, "category": category, "model": model, "prediction": data})
        #print("added new")

def get_user_prediction(username, category):
    user_prediction = {}
    for model in data['us_cum_forecasts']:
        exists = mongo.db.predictions.find_one({"username": username, "category": category, "model": model})
        if exists:
            print('exists')
            user_prediction[model] = exists['prediction']
        else:
            print(category)
            if category is "daily":
                print("is daily")
                print(data['us_inc_forecasts'][model]['value'])
                user_prediction[model] = data['us_inc_forecasts'][model]['value']
            else: 
                user_prediction[model] = data['us_cum_forecasts'][model]['value']
    #print(json.dumps(user_prediction['UCLA']))
    return user_prediction


@app.before_first_request
def make_session_permanent():
    session.permanent = True
    # Get forecasts data when initially launching website6
    data['us_cum_forecasts'] = get_forecasts()
    print("cum forecasts")
    # Get confirmed cases in US
    data['us_cum_confirmed'] = get_us_confirmed()
    print("cum confirmed")
    data['us_inc_forecasts'] = get_daily_forecasts()
    print("inc forecasts")
    # Get new deaths in US
    data['us_inc_confirmed'] = get_us_new_deaths()
    print("inc confirmed")

    #print(data)

@app.route("/")
def template():
    return render_template("template.html")


@app.route("/home", methods=['POST','GET'])
def home():
    if request.method == 'POST':
        model = request.form['models'].strip()
        #print(model)
        #print('model printed')
        add_vote(session['id'], model)
        gained = get_score(model)
        #print(gained)
        update_score(session['username'], gained)
        return redirect(url_for('results'))
    else:
        if 'username' in session:
            user_prediction = get_user_prediction(session['username'], 'cum')
            return render_template("home.html", user_prediction=user_prediction)
        else:
            return redirect(url_for('signin'))

@app.route("/about")
def about():
    return render_template("about.html")

@app.route("/mapportal")
def mapportal():
    return render_template("mapportal.html")

@app.route("/signin", methods=["POST", "GET"])
def signin():
    if request.method == "POST":
        session.permanent = True
        username = request.form["username"]
        password = request.form["password"]
        if authenticate(username, password):
            return redirect(url_for("home"))
        else:
            flash("Invalid username or password. Please try again", "error")
            return redirect(url_for("signin"))
    else:
        if 'id' in session:
            return redirect(url_for('home'))
        return render_template("signin.html")


@app.route("/signup", methods=["POST", "GET"])
def signup():
    if request.method == "POST":
        name = request.form["name"]
        username = request.form["username"]
        password = request.form["password"]
        if register(name, username, password):
            return redirect(url_for("home"))
        else:
            flash("Username is already taken")
            return redirect(url_for("signin"))
    else:
        return redirect(url_for("signin"))


@app.route("/logout")
def logout():
    if 'id' in session:
        session.pop('id')
        session.pop('name')
        session.pop('username')
    return redirect(url_for('signin'))


@app.route("/forecasts")
def forecasts():
    return data['us_cum_forecasts']
    #return data['forecast_data']

@app.route("/daily_forecasts")
def daily_forecasts():
    return data['us_inc_forecasts']
    #return data['daily_forecast_data']

@app.route("/us_cum_deaths")
def us_confirmed():
    return data['us_cum_confirmed']
    #return data['us_cum_deaths']

@app.route('/us-new-deaths-raw')
def new_deaths():
    #print(us_inc_confirmed)
    return data['us_inc_confirmed']
    #return data['us_new_deaths']

@app.route('/us_daily_deaths')
def us_daily_deaths():
    if 'username' in session:
            user_prediction = get_user_prediction(session['username'], 'daily')
            print(user_prediction)
            print("printed!")
            return render_template('new-deaths.html', user_prediction=user_prediction)
    else:
        return redirect(url_for('signin'))

@app.route("/mse")
def mse():
    return get_accuracy_for_all_models()
    #print('errors calculated')

@app.route("/results", methods=["POST", "GET"])
def results():
    vote = mongo.db.votes.find_one({'user_id': session['id']})
    user = mongo.db.users.find_one({'username': session['username']})
    return "You voted for " + vote['prediction_model'] +". You now have " + str(user['score']) + " points."

@app.route("/total")
def total():
    results = {}
    for model in data['us_cum_forecasts']:
        results[model] = fetch_votes(model)
    return json.dumps(results)

@app.route('/market')
def market():
    return render_template("market.html")
    
@app.route('/leaderboard')
def leaderboard():
    all_users = list(mongo.db.users.find({},{'name': 1, 'score': 1}).sort('score',-1))
    return render_template("leaderboard.html", all_users=all_users)

@app.route("/profile", methods=["GET","POST"])
def profile():
    user = mongo.db.users.find({'username': session['username']})
    return render_template("profile.html", user=user)

@app.route('/update/', methods=['POST'])
def update():
    if request.method == 'POST':
        data = request.json
        print(type(data['category']))
        print("category printed")
        if data['category'] == 'daily':
            print('index')
            print(data['index'])
            update_user_prediction(session['username'], data['model'], data['data'], data['category'], data['changed_value'], data['higher'], data['index'])
            #user_prediction = get_user_prediction(session['username'], "daily")
            #render_template('new-deaths.html', user_prediction=user_prediction)
        else:
            update_user_prediction(session['username'], data['model'], data['data'], data['category'])
        return "Success"
    return 'None'

if __name__ == "__main__":
    app.run(debug=True)
