//MARK: 注意
// 直接复制该文件进行扩展开发
// 请保持以下 变量 及 函数 名称不变
// 请勿删减，可以新增

const appConfig = {
    _webSite: 'https://libvio.mov/',
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

    // 分类映射
    categories: {
        '1': '电影',
        '2': '剧集',
        '3': '综艺',
        '4': '动漫'
    },


}

// 全局变量
let hasShownWelcome = false  // 标记是否已显示欢迎提示

/**
 * 异步获取分类列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoClassList())>}
 */
async function getClassList(args) {
    var backData = new RepVideoClassList()
    try {
        // 首次加载时显示欢迎提示
        if (!hasShownWelcome) {
            hasShownWelcome = true
            toast("🍃豆儿出品，不属精品！", 3)  // 显示3秒
        }

        // 返回固定的分类列表
        Object.keys(appConfig.categories).forEach(id => {
            backData.data.push({
                type_id: id,
                type_name: appConfig.categories[id],
                hasSubclass: false
            })
        })
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取二级分类列表筛选列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
    var backData = new RepVideoSubclassList()
    try {
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取分类视频列表
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getVideoList(args) {
    var backData = new RepVideoList()
    try {
        const categoryId = args.url
        let url = `${appConfig.webSite}type/${categoryId}-1.html`

        // 处理分页
        if (args.page > 1) {
            url = `${appConfig.webSite}type/${categoryId}-${args.page}.html`
        }

        const response = await req(url)
        const $ = cheerio.load(response.data)

        // 解析视频列表 - libvio.mov的结构，基于实际HTML结构
        $('ul li').each((_, element) => {
            const $item = $(element)

            // 查找详情页链接
            const $detailLink = $item.find('a[href*="/detail/"]').first()

            if ($detailLink.length > 0) {
                const video = new VideoDetail()

                // 提取视频ID
                const href = $detailLink.attr('href')
                const idMatch = href.match(/\/detail\/(\d+)\.html/)
                if (idMatch) {
                    video.vod_id = idMatch[1]
                }

                // 视频名称 - 从h4标签获取
                const $titleElement = $item.find('h4.title a').first()
                if ($titleElement.length > 0) {
                    video.vod_name = $titleElement.text().trim()
                }

                // 封面图片 - 从缩略图链接获取
                const $thumbLink = $item.find('a.stui-vodlist__thumb').first()
                if ($thumbLink.length > 0) {
                    const picUrl = $thumbLink.attr('data-original')
                    if (picUrl) {
                        video.vod_pic = picUrl.startsWith('//') ? 'https:' + picUrl : picUrl
                    }
                }

                // 状态信息 - 从pic-text获取
                const $picText = $item.find('.pic-text').first()
                if ($picText.length > 0) {
                    video.vod_remarks = $picText.text().trim()
                }

                // 评分信息 - 从pic-tag获取
                const $picTag = $item.find('.pic-tag').first()
                if ($picTag.length > 0) {
                    const score = $picTag.text().trim()
                    if (score && score !== '0.0') {
                        // 如果已有状态信息，追加评分；否则直接使用评分
                        if (video.vod_remarks) {
                            video.vod_remarks += ` ${score}`
                        } else {
                            video.vod_remarks = score
                        }
                    }
                }

                // 只添加有效的视频项
                if (video.vod_id && video.vod_name) {
                    backData.data.push(video)
                }
            }
        })

    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取二级分类列表筛选列表的方法。
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoSubclassList())>}
 */
async function getSubclassList(args) {
    var backData = new RepVideoSubclassList()
    try {
        // libvio.mov暂不支持二级分类
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取二级分类视频列表 或 筛选视频列表
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function getSubclassVideoList(args) {
    var backData = new RepVideoList()
    try {
        // libvio.mov暂不支持二级分类筛选
    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频详情
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoDetail())>}
 */
async function getVideoDetail(args) {
    var backData = new RepVideoDetail()
    try {
        const videoId = args.url
        const url = `${appConfig.webSite}detail/${videoId}.html`

        const response = await req(url)
        const $ = cheerio.load(response.data)

        const video = new VideoDetail()
        video.vod_id = videoId

        // 基本信息 - 只获取uz软件需要的信息
        // 1. 标题
        video.vod_name = $('h1.title').text().trim()

        // 2. 封面图片
        const $mainImg = $('.stui-content__thumb img').first()
        if ($mainImg.length > 0) {
            const picUrl = $mainImg.attr('data-original') || $mainImg.attr('src')
            if (picUrl && !picUrl.includes('load.png')) {
                video.vod_pic = picUrl.startsWith('//') ? 'https:' + picUrl :
                              picUrl.startsWith('/') ? appConfig.webSite.replace(/\/$/, '') + picUrl : picUrl
            }
        }

        // 3. 演职员信息
        $('p.data').each((_, element) => {
            const text = $(element).text()

            // 主演和导演信息
            if (text.includes('主演：')) {
                const match = text.match(/主演：([^\/]+).*导演：(.+)/)
                if (match) {
                    video.vod_actor = match[1].trim()
                    video.vod_director = match[2].trim()
                }
            }
        })

        // 4. 简介信息 - 获取完整版
        const $content = $('.desc.detail .detail-content').first()
        if ($content.length > 0) {
            video.vod_content = $content.text().trim()
        } else {
            // 备用方案：获取简短版
            const $desc = $('.desc.detail .detail-sketch').first()
            if ($desc.length > 0) {
                video.vod_content = $desc.text().trim()
            }
        }

        // 解析播放列表 - 基于实际HTML结构
        const playFromList = []
        const playUrlList = []

        // libvio.mov按播放线路分别解析 - 标记不可用线路
        $('.stui-vodlist__head').each((_, element) => {
            const $vodHead = $(element)

            // 获取线路名称
            const $heading = $vodHead.find('h3').first()
            if ($heading.length === 0) return

            const headingText = $heading.text().trim()
            let playFromName = headingText.replace(/^\s*/, '').replace(/\s*$/, '')

            // 检查是否是通常无法播放的线路
            const isUnplayableRoute = headingText.includes('HD5') ||
                                    headingText.includes('下载') ||
                                    headingText.includes('UC') ||
                                    headingText.includes('夸克')

            // 如果是不可用线路，添加❌标记
            if (isUnplayableRoute) {
                playFromName = `❌ ${playFromName}`
            }

            // 查找该线路的播放列表
            const $playlist = $vodHead.find('.stui-content__playlist')
            if ($playlist.length > 0) {
                const episodeUrls = []

                $playlist.find('li a[href*="/play/"]').each((_, linkElement) => {
                    const $link = $(linkElement)
                    const episodeName = $link.text().trim()
                    const href = $link.attr('href')

                    if (href && episodeName) {
                        episodeUrls.push(`${episodeName}$${href}`)
                    }
                })

                // 如果该线路有播放链接，添加到播放列表
                if (episodeUrls.length > 0) {
                    playFromList.push(playFromName)
                    playUrlList.push(episodeUrls.join('#'))
                }
            }
        })

        // 如果没有找到播放列表，使用备用方法
        if (playFromList.length === 0) {
            const playUrls = []
            $('ul li a[href*="/play/"]').each((_, element) => {
                const $link = $(element)
                const episodeName = $link.text().trim()
                const href = $link.attr('href')

                if (href && episodeName) {
                    playUrls.push(`${episodeName}$${href}`)
                }
            })

            if (playUrls.length > 0) {
                playFromList.push('默认播放')
                playUrlList.push(playUrls.join('#'))
            }
        }

        // 设置播放信息
        if (playFromList.length > 0) {
            video.vod_play_from = playFromList.join('$$$')
            video.vod_play_url = playUrlList.join('$$$')
        }

        backData.data = video

    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 获取视频的播放地址
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoPlayUrl())>}
 */
async function getVideoPlayUrl(args) {
    var backData = new RepVideoPlayUrl()
    try {
        const playUrl = args.url

        // 如果是相对路径，补全域名
        let fullUrl = playUrl
        if (playUrl.startsWith('/')) {
            fullUrl = appConfig.webSite.replace(/\/$/, '') + playUrl
        }

        // 所有播放地址都是在线播放页面，使用嗅探模式

        // 在线播放使用嗅探模式
        backData.sniffer = {
            url: fullUrl,
            ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            timeOut: 30,  // 嗅探超时时间30秒
            retry: 2      // 重试2次
        }

        // 播放时的请求头
        backData.headers = {
            'Referer': appConfig.webSite,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }

    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}

/**
 * 搜索视频
 * @param {UZArgs} args
 * @returns {@Promise<JSON.stringify(new RepVideoList())>}
 */
async function searchVideo(args) {
    var backData = new RepVideoList()
    try {
        const searchKey = encodeURIComponent(args.searchWord)
        const page = args.page || 1  // 如果没有页码，默认为1

        // libvio.mov的搜索URL格式
        let url = `${appConfig.webSite}search/${searchKey}----------${page}---.html`

        const response = await req(url)
        const $ = cheerio.load(response.data)

        // 解析搜索结果 - libvio.mov的结构，基于实际HTML结构
        $('ul li').each((_, element) => {
            const $item = $(element)

            // 查找详情页链接
            const $detailLink = $item.find('a[href*="/detail/"]').first()

            if ($detailLink.length > 0) {
                const video = new VideoDetail()

                // 提取视频ID
                const href = $detailLink.attr('href')
                const idMatch = href.match(/\/detail\/(\d+)\.html/)
                if (idMatch) {
                    video.vod_id = idMatch[1]
                }

                // 视频名称 - 从h4标签获取
                const $titleElement = $item.find('h4.title a').first()
                if ($titleElement.length > 0) {
                    video.vod_name = $titleElement.text().trim()
                }

                // 封面图片 - 从缩略图链接获取
                const $thumbLink = $item.find('a.stui-vodlist__thumb').first()
                if ($thumbLink.length > 0) {
                    const picUrl = $thumbLink.attr('data-original')
                    if (picUrl) {
                        video.vod_pic = picUrl.startsWith('//') ? 'https:' + picUrl : picUrl
                    }
                }

                // 状态信息 - 从pic-text获取
                const $picText = $item.find('.pic-text').first()
                if ($picText.length > 0) {
                    video.vod_remarks = $picText.text().trim()
                }

                // 评分信息 - 从pic-tag获取
                const $picTag = $item.find('.pic-tag').first()
                if ($picTag.length > 0) {
                    const score = $picTag.text().trim()
                    if (score && score !== '0.0') {
                        // 如果已有状态信息，追加评分；否则直接使用评分
                        if (video.vod_remarks) {
                            video.vod_remarks += ` ${score}`
                        } else {
                            video.vod_remarks = score
                        }
                    }
                }

                // 只添加有效的视频项
                if (video.vod_id && video.vod_name) {
                    backData.data.push(video)
                }
            }
        })

    } catch (error) {
        backData.error = error.toString()
    }
    return JSON.stringify(backData)
}