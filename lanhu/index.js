// ==UserScript==
// @name         蓝湖 lanhu
// @version      1.1.1
// @description  自动填充填写过的产品密码(不是蓝湖账户)；查看产品页面窗口改变后帮助侧边栏更新高度
// @author       sakura-flutter
// @namespace    https://github.com/sakura-flutter
// @compatible   chrome >= 80
// @compatible   firefox >= 75
// @run-at       document-start
// @match        https://lanhuapp.com/web/
// @grant        unsafeWindow
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @require      https://greasyfork.org/scripts/411093-toast/code/Toast.js?version=846237
// ==/UserScript==

/* global Vue Toast */

(function() {
    'use strict';
    const $ = document.querySelector.bind(document)

    /* 填充密码 */
    const oldPushState = unsafeWindow.history.pushState
    unsafeWindow.history.pushState = function(...args) {
        oldPushState.apply(unsafeWindow.history, args)
        console.warn('pushState')
        setTimeout(() => {
            autofillPassword()
            record()
        }, 500)
    }

    ;['DOMContentLoaded', 'popstate', 'hashchange'].forEach(eventname => {
        unsafeWindow.addEventListener(eventname, () => {
            console.warn(eventname)
            setTimeout(() => {
                autofillPassword()
                record()
            }, 500)
        })
    })

    function autofillPassword() {
        if (!location.hash.startsWith('#/item/project/door')) return
        const queryString = location.hash.includes('?') ? location.hash.split('?')[1] : ''
        if (!queryString) return
        const pid = new URLSearchParams(queryString).get('pid')
        // 确认登录按钮   密码框
        const [confirmEl, passwordEl] = [
            $('#project-door .mu-raised-button-wrapper'),
            $('#project-door .pass input'),
        ]
        if (!pid || !confirmEl || !passwordEl) return

        const pidPassword = GM_getValue('passwords', {})[pid]
        if (pidPassword) {
            passwordEl.value = pidPassword
            Toast('密码已填写')
            confirmEl.click()
        }

        // 蓝湖刷新会重新跳转到输入密码页 pushState DOMContentLoaded popstate hashchange 可能会导致重复注册事件
        // 标记一下事件
        if (confirmEl.dataset.addedHandler) return
        confirmEl.dataset.addedHandler = '1'

        // 点击后保存密码
        confirmEl.addEventListener('mousedown', savePassword)
        // 回车键保存密码
        passwordEl.addEventListener('keydown', event => {
            if (event.keyCode !== 13) return
            savePassword()
        })

        function savePassword() {
            const savedPassword = GM_getValue('passwords', {})
            const password = passwordEl.value
            GM_setValue('passwords', {
                ...savedPassword,
                [pid]: password,
            })
        }
    }

    /* 更新侧边栏高度 */
    window.addEventListener('resize', throttle(function() {
        const barEl = $('.flexible-bar')
        const modalEl = $('.flexible-modal')
        if (!barEl || !modalEl) return
        barEl.dispatchEvent(new MouseEvent('mousedown'))
        modalEl.dispatchEvent(new MouseEvent('mouseup'))
    }, 150))

    /* 记录看过的产品 */
    function record() {
        const queryString = location.hash.includes('?') ? location.hash.split('?')[1] : ''
        if (!queryString) return
        const hash = location.hash.split('?')[0]
        const pid = new URLSearchParams(queryString).get('pid')
        if (!pid) return

        const records = GM_getValue('records', [])
        records.find((item, index) => {
            if(item.pid === pid) {
                records.splice(index, 1)
                return true
            }
        })
        records.push({
            pid,
            hash,
            queryString,
            title: document.title,
        })
        GM_setValue('records', records)
    }

    createRecordedUI()

    function createRecordedUI() {
        window.addEventListener('DOMContentLoaded', () => {
            const PATH = 'https://lanhuapp.com/web/'

            const ui = new Vue({
                template: `
                  <article id="inject-recorded-ui" @mouseenter="toggle" @mouseleave="toggle">
                    <transition name="fadedd">
                      <ul v-show="recordsVisible">
                        <li v-for="item in reversed" :key="item.pid">
                          <a :href="getHref(item)" :title="item.title" target="_blank">{{item.title}}</a>
                        </li>
                      </ul>
                    </transition>
                    <button class="view-btn">打开最近项目</button>
                  </article>
                `,
                data() {
                    return {
                        records: GM_getValue('records', []),
                        recordsVisible: false,
                    }
                },
                computed: {
                    reversed() {
                        return [...this.records].reverse()
                    },
                },
                created() {
                    GM_addValueChangeListener('records', (name, oldVal, newVal) => {
                        this.records = newVal
                    })
                },
                methods: {
                    getHref(item) {
                        return PATH + item.hash + '?' + item.queryString
                    },
                    toggle() {
                        this.recordsVisible = !this.recordsVisible
                    },
                },
            }).$mount()
            document.body.appendChild(ui.$el)
        })

        // 添加样式
        GM_addStyle(`
          #inject-recorded-ui {
             position: fixed;
             right: 3vw;
             bottom: 8vh;
             z-index: 1000;
             width: 220px;
             padding: 20px 20px 10px;
          }
          #inject-recorded-ui ul::-webkit-scrollbar {
             width: 8px;
             height: 8px;
             background: #f2f2f2;
             padding-right: 2px;
          }
          #inject-recorded-ui ul::-webkit-scrollbar-thumb {
             border-radius: 3px;
             border: 0;
             background: #b4bbc5;
          }
          #inject-recorded-ui .fadedd-enter-active, #inject-recorded-ui .fadedd-leave-active {
             transition: all .1s;
          }
           #inject-recorded-ui .fadedd-enter, #inject-recorded-ui .fadedd-leave-to {
             transform: translateY(5px);
             opacity: 0;
          }
          #inject-recorded-ui ul {
             padding: 5px;
             max-height: 40vh;
             overflow-x: auto;
             background: rgb(251, 251, 251);
             box-shadow: 0 1px 6px rgba(0,0,0,.15);
          }
          #inject-recorded-ui a {
             display: block;
             line-height: 30px;
             padding: 0 5px;
             overflow: hidden;
             text-overflow: ellipsis;
             white-space: nowrap;
             transition: background 0.1s ease-out;
          }
          #inject-recorded-ui a:hover {
             background: rgba(220, 237, 251, 0.64);
          }
          #inject-recorded-ui .view-btn {
             display: block;
             margin: 8px auto 0;
             padding: 4px 12px;
             transition: opacity .1s;
             opacity: .5;
             color: #fff;
             background:#3385ff;
             box-shadow:0 1px 6px rgba(0,0,0,.2);
             border: none;
             border-radius: 2px;
          }
          #inject-recorded-ui:hover .view-btn {
             opacity: 1;
          }
        `)
    }

    function throttle(fn, delay) {
        var t = null,
            begin = new Date().getTime();

        return function (...args) {
            var _self = this,
                cur = new Date().getTime();

            clearTimeout(t);

            if (cur - begin >= delay) {
                fn.apply(_self, args);
                begin = cur;
            } else {
                t = setTimeout(function () {
                    fn.apply(_self, args);
                }, delay);
            }
        }
    }
})();