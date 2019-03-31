const state = {
	count:0
}

observe(state)

autorun(() => {
	//dep.depend()
	console.log(state.count)
})

//dep.notify()
state.count++