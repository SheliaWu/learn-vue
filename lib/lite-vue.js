/*
 * @Descripttion: 
 * @version: 
 * @Author: shelia
 * @Date: 2021-03-31 11:16:07
 * @LastEditors: shelia
 * @LastEditTime: 2021-03-31 14:46:26
 */
class LiteVue{
  constructor(options){
    this.options = options
    //数据初始化
    this.initData(options)
    let el = this.options.id;
    //实例的挂载
    this.$mount(el);
  }
  initData(options){
    if(!options.data) return
    this.data = options.data
    new Observer(options.data)
  }
  $mount(el){
    // 模拟render
    const updateView = _ => {
      let innerHtml = document.querySelector(el).innerHTML + ''
      // hack的写法，为了体现更改data的值也能改变html
      let key = (/{(\w+)}/.test(innerHtml) && innerHtml.match(/{(\w+)}/)[1]) || 'test';
      document.querySelector(el).innerHTML= this.options.data[key]
    }
    // 创建一个渲染的依赖
    new Watcher(updateView, true)
  }
}
class Observer{
  constructor(data){
    // 实例化walk方法对每个数据属性重写getter,setter方法
    this.walk(data)
  }
  walk(obj){
    const keys = Object.keys(obj)
    for(let i = 0; i < keys.length; i++){
      defineReactive(obj, keys[i])
    }
  }
}
class Watcher {
  constructor(expOrFn, isRenderWatcher){
    console.log("expOrFn", expOrFn)
    this.getter = expOrFn
    // Watcher.proptotype.get的调用会进行状态的更新
    this.get()
  }
  get(){
    // 当前执行的watcher
    Dep.target = this
    this.getter()
    Dep.target = null
  }
  update(){
    this.get()
  }
}
//Watcher可以理解为每个数据需要监听的依赖，那么Dep可以理解为对依赖的一种管理
let uid = 0;
class Dep {
  constructor(){
    this.id = uid++;
    this.subs = []
  }
  //依赖收集
  depend(){
    if(Dep.target){
      // Deap.target是当前的watcher，将当前的依赖推入subs中
      this.subs.push(Dep.target)
    }
  }
  //派发更新
  notify(){
    const subs = this.subs.slice();
    console.log('subs', subs)
    for(var i = 0, l = subs.length; i < l; i++){
      console.log('watcher', subs[i])
      subs[i].update();
    }
  }
}
Dep.target = null
// 依赖管理过程

const defineReactive = (obj, key) => {
  const dep = new Dep();
  const property = Object.getOwnPropertyDescriptor(obj, key);
  const getter = property && property.get
  const setter = property && property.set
  let val = obj[key]
  if(property && property.configurable === false) return;
  if ((!getter || setter)) {
    val = obj[key]
  }
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: true,
    get(){
      const value = getter ? getter.call(obj) : val
      if(Dep.target){
        dep.depend()
      }
      return value
    },
    set(nval){
      if(nval === val) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = nval
      }
      dep.notify()
    }
  })
}