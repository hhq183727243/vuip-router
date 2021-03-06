function parseQueryString(url) {
    var params = {};
    var arr = url.split("?");
    if (arr.length <= 1) {
        return params;
    }
    arr = arr[1].split("&");
    for (var i = 0, l = arr.length; i < l; i++) {
        var a = arr[i].split("=");
        params[a[0]] = a[1];
    }
    return params;
}

function formatUrl(url, params) {
    if (!params) {
        return url;
    }
    let paramsArray = [];
    //拼接参数
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
            paramsArray.push(key + '=' + params[key])
        }
    })
    if (url.search(/\?/) === -1) {
        url += '?' + paramsArray.join('&')
    } else {
        url += '&' + paramsArray.join('&')
    }

    return url;
}

// 是否是无效数据
function isDef(v) {
    return (v === '' || v === null || v === undefined)
}

// 单实例$router
let $router = null;
let Vuip = null;
let cid = 0;
/**
 * @param routes 路由配置
*/
class VuipRouter {
    constructor(routes) {
        // 保证单实例
        if ($router) return $router;
        this.routes = routes;
        this._initRouter();
        this._registerGlobalComponent();
        $router = this;

        // 浏览器后退事件监听
        window.addEventListener('popstate', () => {
            if ($router) {
                $router.to();
            }
        })
    }
    static install(_Vuip) {
        Vuip = _Vuip;
        Vuip.component('RouterView', {
            name: 'RouterView',
            render(h, vm) {
                $router.$vm = vm;
                // 根据 $router 返回pathname对应组件
                if ($router.routes[$router.pathname] === undefined) {
                    return h('<div :class="props.class || \'\'"><v-if test="false"><div></div></v-if></div>');
                }
                return h('<div :class="props.class || \'\'"><Compt_' + $router.routes[$router.pathname]._name + ' /></div>');
            }
        });

        Vuip.component('RouterLink', {
            name: 'RouterLink',
            methods: {
                handleClick(e) {
                    // 是否默认执行默认行为
                    if (this.props.target !== '_blank') {
                        e.preventDefault();
                    } else {
                        return;
                    }

                    // 如果当前href === $router.pathname则不入栈
                    if (!$router || this.props.href === $router.pathname) {
                        return;
                    }

                    $router.to(this.props.href);
                }
            },
            render(h, vm) {
                return h('<a :class="props.class || \'\'" :href="props.href" onclick="handleClick" :target="props.target"><slot /></a>');
            }
        });
    }
    _initRouter() {
        const { pathname, search } = window.location;
        this.location = window.location;
        this.search = search;
        this.pathname = pathname;
        this.query = parseQueryString(search);
    }
    // 将router 注册为全局组件
    _registerGlobalComponent() {
        for (let pathname in this.routes) {
            this.routes[pathname]._name = (this.routes[pathname].name === undefined ? '' : this.routes[pathname].name) + cid++;
            Vuip.component('Compt_' + this.routes[pathname]._name, this.routes[pathname]);
        }
    }

    // 路由变更是触发
    _changeRouter(path) {
        if (path) window.history.pushState(null, null, path);
        this._initRouter();
        if (this.$vm) {
            this.$vm.watcher.get();
        }
    }
    back(n) {
        window.history(isDef(n) ? -1 : n);
    }
    to(path, params) {
        this._changeRouter(formatUrl(path, params));
    }
}


export default VuipRouter;