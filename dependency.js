window.Dep = class Dep{
	constructor(){
		this.subscribers = new Set()
	}

	depend(){
		if(activeUpdate){
			this.subscribers.add(activeUpdate)
		}
	}

	notify(){
		this.subscribers.forEach(sub => sub())
	}
}

let dep = new Dep()
let activeUpdate

function autorun(update){
	function wrappedUpdate(){
		activeUpdate = wrappedUpdate;
		update()
		activeUpdate = null
	}
}

autorun(() => {
	dep.depend()
})



//https://juejin.im/post/5b66e3296fb9a04f9e23321c

get:function reactiveGetter(){
	const value = getter? getter.call(obj):value
	//如果存在需要收集依赖,Dep.target表示一个依赖，即观察者，大部分情况下是一个依赖函数
	if(Dep.target){
		dep.depend()
		if(childOb){
			//每个对象的obj.__ob__.dep中也收集依赖,childOb == _ob_
			childOb.dep.depend()
			//属性如果是数组，进行数组的依赖收集操作
			if(Array.isArray(value)){
				dependArray(value);
			}
		}
	}
	return value
}

function dependArray(value:Array<any>){
	for(let e, i  = 0, l = value.length; i < l; i++){
		e = value[i]
		e&&e.__ob__&&e.__ob__.dep.depend()
		if(Array.isArray(e)){
			dependArray(e)
		}
	}
}

set:function reactiveSetter(newVal){
	const value = getter ? getter.call(obj):value
	if(newVal === value || (newVal !== newVal && value !== value)){
		return
	}
	if(Array.isArray(value)){
		const argument = hasProto ? protoAugment : copyAugment
		//拦截修改数组方法
		augment(value, arrayMethods, arrayKeys)
		//递归观测数组中的每一个值
		this.observeArray(value)
	}
	if(process.envNODE_ENV !== 'production' && customerSetter){
		customerSetter()
	}
	if(setter){
		setter.call(obj, newVal)
	}else{
		val = newVal
	}
	//由于属性值发生了变化，则为属性创建新的childOb,重新observe
	childOb = !shallow && observe(newVal)
	dep.notify()
}

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
	'push',
	'pop',
	'shift',
	'unshift',
	'splice',
	'sort',
	'reverse'
]

methodsToPatch.forEach(function(method){
	//缓存原来的方法
	const original = arrayProto[method]
	//拦截修改数组的方法，当修改数组方法被调用时，触发数组中的__ob__.dep的所有依赖
	def(arrayMethods, method, function mutator(...args){
		const result = original.apply(this, args)
		const ob =  this.__ob__
		switch(method){
			case 'push':
			case 'unshift':
				inserted = args
				break
			case 'splice':
				inserted = args.slice(2)
				break
		}
		//对新增元素使用observeArray进行观测
		if(inserted) ob.observeArray(inserted)
		//触发__ob__.dep中的所有依赖
		ob.dep.notify()
		return result
	})
})

observeArray(items:Array<any>){
	if(!isObject(value) || value instanceof VNode){
		return
	}
	for(let i = 0, l = items.length; i < l; i++){
		observe(items[i])
	}
}

//runtime/index.js
Vue.prototype.$mount = function(el?:string|Element, hydrating?:boolean):Component{
	el = el && inBroser ? query(el) : undefined
	return mountComponent(this, el, hydrating)
}
//entry-runtimee-with-compiler.js
Vue.prototype.$mount = function(el?: string | Element,  hydrating?: boolean):Component{
	el = el && query(el)
	//检查挂载点是不是在body或者html元素
	if(el === document.body || el === document.documentElement){
		process.env.NODE_ENV !== 'production' && warn('`Do not mount Vue to <html> or <body> - mount to normal elements instead.`')
		return this
	}

	const options = this.$options
	//判断渲染函数不存在时
	if(!options.render){
		...//构建渲染函数
	}

	//调用运行时vue的$mount()函数
	return mount.call(this, el, hydrating)
}


//watcher类
export default class Watcher {
  ... //
  // 构造函数
  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      // 将渲染函数的观察者存入_watcher
      vm._watcher = this
    }
    //将所有观察者push到_watchers列表
    vm._watchers.push(this)
    // options
    if (options) {
      // 是否深度观测
      this.deep = !!options.deep
      // 是否为开发者定义的watcher（渲染函数观察者、计算属性观察者属于内部定义的watcher）
      this.user = !!options.user
      // 是否为计算属性的观察者
      this.computed = !!options.computed
      this.sync = !!options.sync
      //在数据变化之后、触发更新之前调用
      this.before = options.before
    } else {
      this.deep = this.user = this.computed = this.sync = false
    }
    // 定义一系列实例属性
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.computed // for computed watchers
    this.deps = []
    this.newDeps = []
    // depIds 和 newDepIds 用书避免重复收集依赖
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    // 兼容被观测数据，当被观测数据是function时，直接将其作为getter
    // 当被观测数据不是function时通过parsePath解析其真正的返回值
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = function () {}
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    if (this.computed) {
      this.value = undefined
      this.dep = new Dep()
    } else {
      // 除计算属性的观察者以外的所有观察者调用this.get()方法
      this.value = this.get()
    }
  }

  // get方法
  get () {
    ...
  }
  // 添加依赖
  addDep (dep: Dep) {
    ...
  }
  // 移除废弃观察者；清空newDepIds 属性和 newDeps 属性的值
  cleanupDeps () {
    ...
  }
  // 当依赖变化时，触发更新
  update () {
    ...
  }
  // 数据变化函数的入口
  run () {
    ...
  }
  // 真正进行数据变化的函数
  getAndInvoke (cb: Function) {
    ...
  }
  //
  evaluate () {
    ...
  }
  //
  depend () {
    ...
  }

  //
  teardown () {
    ...
  }
}
