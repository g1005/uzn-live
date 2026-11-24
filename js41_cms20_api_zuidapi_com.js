//@name:🍀最大资源
//@version:1
//@webSite:https://api.zuidapi.com/api.php/provide/vod
//@remark:通用采集直链，地址失效请自行更换

const appConfig = {
    _webSite: 'https://api.zuidapi.com/api.php/provide/vod',
    /**
     * 网站主页，uz 调用每个函数前都会进行赋值操作
     * 如果不想被改变 请自定义一个变量
     */
    get webSite() {
        return this._webSite
    },
    set webSite(value) {
        this._webSite = value
    },

    _uzTag: '',
    /**
     * 扩展标识，初次加载时，uz 会自动赋值，请勿修改
     * 用于读取环境变量
     */
    get uzTag() {
        return this._uzTag
    },
    set uzTag(value) {
        this._uzTag = value
    },
    // 忽略的分类名称列表
    ignoreClassName: ['短剧', '资讯', '明星资讯', '影视资讯', '演员', '内地', '港台', '欧美', '日韩'],

    reqOptions: {
        receiveTimeout: 40,
    },
}

async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        let response = await req(appConfig.webSite, appConfig.reqOptions)
        let data = JSON.parse(response.data)
        backData.data = data.class.filter((item) => {
            const typeName = item.type_name.toLowerCase()
            return !appConfig.ignoreClassName.some((keyword) =>
                typeName.includes(keyword.toLowerCase())
            )
        })
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function getSubclassList(args) {
    var backData = new RepVideoSubclassList()
    try {
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function getVideoList(args) {
    var backData = new RepVideoList()
    try {
        let response = await req(`${appConfig.webSite}?ac=detail&t=${args.url}&pg=${args.page}`, appConfig.reqOptions)
        let data = JSON.parse(response.data)
        backData.data = data.list
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function getSubclassVideoList(args) {
    var backData = new RepVideoList()
    try {
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        let response = await req(`${appConfig.webSite}?ac=detail&ids=${args.url}`, appConfig.reqOptions)
        let data = JSON.parse(response.data)
        let video = data.list[0]
        backData.data = video
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    try {
        backData.data = args.url
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        const response = await req(`${appConfig.webSite}?ac=detail&wd=${args.searchWord}&pg=${args.page}`, appConfig.reqOptions)
        const data = JSON.parse(response.data)
        backData.data = data.list
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}
