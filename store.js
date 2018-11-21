// lib
function createStore(reducer) {

    let state
    let listeners = []

    const getState = () => state

    const subscribe = (listener) => {
        listeners.push(listener)

        return () => {
            listeners = listeners.filter((l) => l !== listener)
        }
    }

    const dispatch = (action) => {
        state = reducer(state, action)
        listeners.forEach((listener) => listener())
    }

    return {
        getState,
        subscribe,
        dispatch
    }
}
// app
const ADD_TODO = 'ADD_TODO';
const REMOVE_TODO = 'REMOVE_TODO';
const TOGGLE_TODO = 'TOGGLE_TODO';
const ADD_GOAL = 'ADD_GOAL';
const REMOVE_GOAL = 'REMOVE_GOAL';
const RECEIVE_DATA = 'RECEIVE_DATA'


function addTodoAction(todo) {
    return {
        type: ADD_TODO,
        todo
    }
}

function removeTodoAction(id) {
    return {
        type: REMOVE_TODO,
        id
    }
}

function toggleTodoAction(id) {
    return {
        type: TOGGLE_TODO,
        id
    }
}

function addGoalAction(goal) {
    return {
        type: ADD_GOAL,
        goal
    }
}

function removeGoalAction(id) {
    return {
        type: REMOVE_GOAL,
        id
    }
}

function receiveDataAction(todos, goals) {
    return {
        type: RECEIVE_DATA,
        todos,
        goals
    }
}

function todos(state = [], action) {
    switch (action.type) {
        case ADD_TODO:
            return state.concat([action.todo])
        case REMOVE_TODO:
            return state.filter(todo => todo.id !== action.id)
        case TOGGLE_TODO:
            return state.map(todo => todo.id !== action.id
                ? todo
                : Object.assign({}, todo, { complete: !todo.complete })
            )
        case RECEIVE_DATA:
            return action.todos
        default:
            return state
    }

}

function handleInitialData() {
    return (dispatch) => {
        Promise.all([
            API.fetchTodos(),
            API.fetchGoals()
        ]).then(([todos, goals]) => {
            dispatch(receiveDataAction(todos, goals))
        })

    }
} 
function handleAddTodo(name, callback) {
    return (dispatch) => {
        API.saveTodo(name)
            .then( todo => {
                dispatch(addTodoAction(todo))
                callback()
            })
            .catch(() => {
                alert('There was an erro. try again')
            })
    }
}
function handleToggle(id) {
    return (dispatch) => {
        dispatch(toggleTodoAction(id))
        API.saveTodoToggle(id)
            .catch(() => {
                dispatch(toggleTodoAction(id))
                alert('an error occurred. try again')
            })
    }
}
function handleDeleteTodo(todo) {
    return (dispatch) => {
        dispatch(removeTodoAction(todo.id))
        API.deleteTodo(todo.id)
            .catch(() => {
                dispatch(addTodoAction(todo))
                alert('an error occurred. try again')
            })
    }
   
}
function handleAddGoal(name, callback) {
    return (dispatch) => {
        API.saveGoal(name)
            .then(goal => {
                dispatch(addGoalAction(goal))
                callback()
            })
            .catch(() => {
                alert('Sorry about that, an error accurred, try again')
            })
    }
}

function handleRemoveGoal(goal) {
    return (dispatch) => {
        dispatch(removeGoalAction(goal.id))
        API.deleteGoal(goal.id)
            .catch(() => {
                dispatch(addGoalAction(goal))
                alert('An error occurred, try again')
            })
    }
}

function goals(state = [], action) {
    switch (action.type) {
        case ADD_GOAL:
            return state.concat([action.goal])
        case REMOVE_GOAL:
            return state.filter(goal => goal.id !== action.id)
        case RECEIVE_DATA:
            return action.goals
        default:
            return state
    }

}

function loading(state = true, action) {
    switch (action.type) {
        case RECEIVE_DATA:
            return false
        default:
            return state
    }
}

function app(state = {}, action) {
    return {
        todos: todos(state.todos, action),
        goals: goals(state.goals, action)
    }
}

function generateId() {
    return Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36)
}

function addTodo() {
    const input = document.getElementById("todo")
    const name = input.value
    input.value = ""

    store.dispatch(addTodoAction({
        name,
        complete: false,
        id: generateId()
    }))
}

function createRemoveButton(onClick) {
    const removeBtn = document.createElement("button")
    removeBtn.innerHTML = "X"
    removeBtn.addEventListener("click", onClick)
    return removeBtn
}

function addTodoToDOM(todo) {
    const node = document.createElement("li")
    const text = document.createTextNode(todo.name)
    const removeBtn = createRemoveButton(() => {
        store.dispatch(removeTodoAction(todo.id))
    })

    node.appendChild(text)
    node.classList.add("todo")
    if(todo.complete){
        node.classList.add("todo-complete")
    }
    node.addEventListener("click", () => {        
        store.dispatch(toggleTodoAction(todo.id))
    })

    document.getElementById("todos")
        .appendChild(node)
        .appendChild(removeBtn);
}


function addGoalToDOM(goal) {
    const node = document.createElement("li")
    const text = document.createTextNode(goal.name)
    const removeBtn = createRemoveButton(() => {
        store.dispatch(removeGoalAction(goal.id))
    })

    node.appendChild(text)
    

    document.getElementById("goals")
        .appendChild(node)
        .appendChild(removeBtn);
}

function addGoal() {
    const input = document.getElementById("goal")
    const name = input.value
    input.value = ""

    store.dispatch(addGoalAction({
        id: generateId(),
        name
    }))
}

//const store = createStore(app)

const checker = (store) => (next) => (action) => {
    if(action.type === ADD_TODO && action.todo.name.toLowerCase().includes('bitcoin')) {
        return alert("Nope. That's a bad idea.")
    }
    if(action.type === ADD_GOAL && action.goal.name.toLowerCase().includes('bitcoin')) {
        return alert("Nope. That's a bad idea.")
    }

    next(action)
}
const logger = store => next => action => {
    console.group(action.type)
        console.log("The action: ", action)
        const result = next(action)
        console.log("The new state:", store.getState())
    console.groupEnd()
    return result
    
}

const thunk = (store) => (next) => (action) => {
    if(typeof action === 'function') {
        return action(store.dispatch)
    }
    return next(action)
}


const store = Redux.createStore(Redux.combineReducers({
    todos, goals, loading
}), Redux.applyMiddleware(ReduxThunk.default, checker, logger))


/*
document.getElementById("todoBtn")
    .addEventListener("click", addTodo)
document.getElementById("goalBtn")
    .addEventListener("click", addGoal)

store.subscribe(() => {
    const { goals, todos } = store.getState()
    document.getElementById("goals").innerHTML = ""
    document.getElementById("todos").innerHTML = ""
    goals.forEach(addGoalToDOM)
    todos.forEach(addTodoToDOM)
})
*/
