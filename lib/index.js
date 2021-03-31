/*
 * @Descripttion: 
 * @version: 
 * @Author: shelia
 * @Date: 2021-03-31 11:15:32
 * @LastEditors: shelia
 * @LastEditTime: 2021-03-31 14:46:36
 */
var vm = new LiteVue({
  id: '#app',
  data:{
    test: 12
  }
})
document.querySelector('#increament').addEventListener('click',() => {
  console.log("+1")
  vm.data.test += 1
})