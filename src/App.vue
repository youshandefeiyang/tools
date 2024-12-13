<template>
  <div id="app" class="container">
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="EPG接口" name="epg"></el-tab-pane>
      <el-tab-pane label="直播源格式转换" name="formatConversion"></el-tab-pane>
      <el-tab-pane label="接口解密" name="decrypt"></el-tab-pane>
      <el-tab-pane label="更多功能" name="more"></el-tab-pane>
    </el-tabs>

    <div v-show="activeTab === 'epg'" class="text-center mt-3">
      <el-card>
        <h2>肥羊EPG XML格式：</h2>
        <el-row class="text-center mt-3 button-group">
          <el-button type="primary" icon="el-icon-document-copy" v-clipboard:copy="'https://epg.v1.mk/fy.xml'"
                     v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyError">
            点击复制 https://epg.v1.mk/fy.xml
          </el-button>
          <el-button type="primary" icon="el-icon-document-copy" v-clipboard:copy="'https://epg.v1.mk/fy.xml.gz'"
                     v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyError">
            点击复制 https://epg.v1.mk/fy.xml.gz
          </el-button>
        </el-row>

        <h2>肥羊EPG JSON格式：</h2>
        <el-row class="text-center mt-3 button-group">
          <el-button type="primary" icon="el-icon-document-copy"
                     v-clipboard:copy="'https://epg.v1.mk/json?ch=频道名&date=日期'"
                     v-clipboard:success="onCopySuccess" v-clipboard:error="onCopyError">
            点击复制 https://epg.v1.mk/json?ch=cctv1&date=20240604
          </el-button>
        </el-row>

        <h2>肥羊直播Logo库：</h2>
        <el-row class="text-center mt-3 button-group">
          <el-button type="primary" icon="el-icon-document-copy"
                     v-clipboard:copy="'https://epg.v1.mk/logo/节目名.png'" v-clipboard:success="onCopySuccess"
                     v-clipboard:error="onCopyError">
            点击复制 https://epg.v1.mk/logo/节目名.png
          </el-button>
        </el-row>
      </el-card>
    </div>

    <div v-show="activeTab === 'formatConversion'" class="text-center mt-3">
      <h1 class="text-center mb-5">直播源格式转换</h1>
      <el-upload class="upload-demo" action="false" drag multiple :before-upload="() => false" :on-change="handleFileChange">
        <i class="el-icon-upload"></i>
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div class="el-upload__tip" slot="tip">仅支持 .txt 和 .m3u 格式的文件</div>
      </el-upload>
      <div class="input-group mb-3">
        <el-input type="textarea" rows="20" v-model="source"
                  placeholder="上传内容显示区域（你可以不用上传，直接粘贴你想转换的不定数量直播源链接至此，直播源支持rtsp/rtp等组播格式链接）"
                  @input="checkContent"></el-input>
        <el-input type="textarea" rows="20" v-model="result" placeholder="转换后的内容显示区域"
                  readonly></el-input>
      </div>
      <el-row class="text-center mt-3 button-group">
        <el-button type="primary" @click="tran2m3ugroup" :disabled="!isTxtFormat">txt 转 m3u</el-button>
        <el-button type="success" @click="m3uToTxt" :disabled="!isM3uFormat">m3u 转 txt</el-button>
        <el-button type="danger" v-clipboard:copy="result" v-clipboard:success="onCopySuccess"
                   v-clipboard:error="onCopyError" :disabled="!result">复制转化后的结果
        </el-button>
        <el-button type="warning" @click="download" :disabled="!result">下载转化后的文件</el-button>
      </el-row>
    </div>

    <div v-show="activeTab === 'decrypt'">
      <h1 class="text-center mb-5">TVBOX/影视接口解密</h1>
      <div class="input-group mb-3">
        <el-select v-model="url" @input.native="handleInput" allow-create filterable placeholder="可输入其他接口，已有接口直接选择即可！"
                   style="width: 100%" class="custom-select">
          <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value"></el-option>
        </el-select>
        <el-button type="primary" @click="crawl">解密</el-button>
      </div>
      <el-input type="textarea" v-model="originResult" rows="20" readonly v-loading="loading"></el-input>
      <el-row class="text-center mt-3 button-group">
        <el-button type="warning" v-clipboard:copy="pureResult" v-clipboard:success="onCopySuccess"
                   v-clipboard:error="onCopyError" :disabled="!originResult">复制解密结果
        </el-button>
      </el-row>
    </div>

    <div v-show="activeTab === 'more'" class="text-center mt-3">
      <el-alert title="更多功能即将上线，敬请期待" type="info" show-icon></el-alert>
    </div>
    <footer>
      <el-row class="text-center mt-3 button-group">
        <el-button type="primary" @click="openTG">加入肥羊影音数码综合交流群</el-button>
        <el-button type="danger" @click="openHezu">家庭影音账号/设备合租购买推荐</el-button>
      </el-row>
    </footer>
  </div>
</template>

<script>

import jsonData from './assets/logo.json';
import * as OpenCC from 'opencc-js'

export default {
  name: 'App',
  data() {
    return {
      activeTab: 'epg',
      url: '',
      source: '',
      result: '',
      originResult: '',
      pureResult: '',
      loading: false,
      isTxtFormat: false,
      isM3uFormat: false,
      jsonData: [],
      options: [
        {label: '饭太硬线路', value: 'http://www.饭太硬.com/tv/'},
        {label: '肥猫线路', value: 'http://肥猫.com'},
        {label: '放牛线路', value: 'http://tvbox.王二小放牛娃.xyz'},
        {label: 'OK线路', value: 'http://ok321.top/tv'},
        {label: '骚0线路', value: 'https://www.100km.top/0'},
        {label: '菜妮丝线路', value: 'https://tv.xn--yhqu5zs87a.top'},
        {label: 'PG线路', value: 'http://152.32.170.60/leevi/PiG/raw/branch/master/jsm.json'},
        {label: '道长线路', value: 'https://pastebin.com/raw/5NHaxyGR'},
        {label: '小白线路', value: 'http://bp.tvbox.cam/'},
        {
          label: '香雅情线路',
          value: 'https://raw.githubusercontent.com/xyq254245/xyqonlinerule/main/XYQTVBox.json'
        },
        {label: '巧儿线路', value: 'http://pandown.pro/tvbox/tvbox.json'},
        {label: '小米线路', value: 'http://xhww.fun/小米/DEMO.json'},
        {label: 'Ray线路', value: 'https://100km.top/0'},
        {label: '俊佬线路', value: 'http://home.jundie.top:81/top98.json'},
        {label: '老刘备线路', value: 'https://raw.liucn.cc/box/m.json'},
        {label: '荷城线路', value: 'http://rihou.cc:88/荷城茶秀'},
        {label: '南风线路', value: 'https://raw.githubusercontent.com/yoursmile66/TVBox/main/XC.json'},
        {label: '开心线路', value: 'http://rihou.vip:55/天天开心'},
        {label: 'D佬魔改', value: 'https://download.kstore.space/download/2883/nzk/nzk0722.json'},
        {
          label: '月光线路',
          value: 'https://gh.con.sh/https://raw.githubusercontent.com/guot55/yg/main/ygbox.json'
        },
        {
          label: '欧歌线路',
          value: 'http://o.nxog.top/m/111.php?ou=公众号欧歌app&mz=index&jar=index&123&b=欧歌'
        },
        {
          label: '吾爱线路',
          value: 'http://52pan.top:81/api/v3/file/get/174964/%E5%90%BE%E7%88%B1%E8%AF%84%E6%B5%8B.m3u?sign=rPssLoffquDXszCARt6UNF8MobSa1FA27XomzOluJBY%3D%3A0'
        },
        {label: '东辰线路', value: 'https://gitee.com/dongchenys/liu/raw/master/hc.json'},
        {label: '星辰线路', value: 'http://8.210.232.168/xc.json'},
        {label: '神仙线路', value: 'http://www.liuyunw.com:88/img'},
        {
          label: '不良帅线路',
          value: 'https://notabug.org/qizhen15800/My9394/raw/master/%e4%b8%8d%e8%89%af%e5%b8%85.json'
        },
        {label: '巴拉线路', value: 'https://jxjson.icu/balabala'},
        {label: '喵影视线路', value: 'http://meowtv.cn/tv'},
        {label: '万达线路', value: 'https://www.macms.pro/box/3.json'},
        {label: '小胡线路', value: 'http://xiaohu.xzam.cn/xiaohu'},
        {label: '小马线路', value: 'https://szyyds.cn/tv/x.json'},
        {label: '看电影线路', value: 'https://tv.lan2wan.top/candymuj.json'},
        {label: '摸鱼线路', value: 'http://我不是.摸鱼儿.top'},
        {label: '业余线路', value: 'http://47.108.190.141/yydf/yydf/bd/yydf.json'},
        {label: '夜猫子线路', value: 'https://codeberg.org/Xym/ymz/raw/branch/main/夜猫子'},
        {label: '大头线路', value: 'https://tvbox.qhycat.com/tv'},
        {label: '影迷线路', value: 'http://39.108.153.41/box/影迷.json'},
        {label: '云网线路', value: 'http://tv.662820.com/api/v3/file/get/135826'},
        {label: '无意线路', value: 'http://www.wya6.cn/tv/yc.json'}
      ]
    }
  },
  created() {
    this.loadJsonData();
  },
  methods: {
    loadJsonData() {
      this.jsonData = jsonData;
    },
    handleInput(event) {
      const inputValue = event.target.value;
      if (inputValue && !this.options.find(option => option.value === inputValue)) {
        this.options.unshift({ value: inputValue, label: inputValue });
      }
      this.url = inputValue;
    },
    crawl() {
      let re = new RegExp("http(s*)://[^\s]*")
      if (re.exec(this.url) === null) {
        this.$message.warning("请输入正确的TVBOX配置链接")
        return
      }
      this.loading = true
      fetch(`https://feiyangdigital.v1.mk/api/jiemi.php?url=${encodeURIComponent(this.url)}`)
          .then(response => response.text())
          .then(data => {
            this.originResult = data
            let reg = /{[\s\S]*}/g
            this.pureResult = this.originResult.match(reg)[0]
            this.loading = false
          })
          .catch(() => {
            this.loading = false
            this.$message.error('解密失败')
          })
    },
    onCopySuccess() {
      this.$message.success('复制成功！')
    },
    onCopyError() {
      this.$message.error('复制失败')
    },
    openTG() {
      window.open('https://t.me/feiyangdigital', '_blank')
    },
    openHezu() {
      window.open('https://hezu.v1.mk', '_blank')
    },
    handleTabClick(tab) {
      if (tab.name === 'formatConversion') {
        this.noTice()
      }
    },
    noTice() {
      const h = this.$createElement
      this.$notify({
        title: '温馨提示',
        showClose: true,
        center: true,
        type: 'warning',
        message: h("p", null, [
          h("span", null, "直播源格式转换功能 "),
          h("span", {style: "color: red"}, "纯前端JS实现"),
          h("span", null, " 绝不会偷源"),
        ]),
      })
    },
    handleFileChange(file) {
      if (!file) return
      const isTxtOrM3u = file.name.endsWith('.txt') || file.name.endsWith('.m3u');
      if (!isTxtOrM3u) {
        this.$message.error('上传文件格式不正确，只允许 .txt 和 .m3u 格式的文件');
        return false
      }
      const reader = new FileReader()
      reader.onload = (e) => {
        this.source = e.target.result.replace(/&amp;/g, '&')
        this.checkContent()
        this.$message.success('文件上传成功')
      }
      reader.readAsText(file.raw)
    },
    checkContent() {
      this.isTxtFormat = !this.source.includes('#EXTINF') && !this.source.includes('#EXTM3U')
      this.isM3uFormat = this.source.includes('#EXTINF') || this.source.includes('#EXTM3U')
    },
    tran2m3ugroup() {
      const source = this.source.split('\n')
      let result = `#EXTM3U x-tvg-url="https://epg.v1.mk/fy.xml"\n`
      const epglists = this.jsonData

      source.forEach(line => {
        const iptv = line.split(",")
        if (!this.isValidIptvLine(iptv, line)) return

        let gname = this.determineGroupName(iptv[0])
        gname = this.adjustGroupNameBasedOnRegion(iptv[0], gname)

        const tid = this.sanitizeChannelName(iptv[0])
        const tvg = this.matchTvgName(tid, epglists) || iptv[0]
        const logourl = `https://epg.v1.mk/logo/${tvg}.png`

        result += `#EXTINF:-1,tvg-id="${tvg}" tvg-name="${tvg}" tvg-logo="${logourl}" group-title="${gname}",${iptv[0]}\n${iptv[1]}\n`
      })

      this.result = result
      if (result) this.$message.success('转换为 m3u 成功')
    },

    matchTvgName(query, epglists) {
      const converter = OpenCC.Converter({from: 'hk', to: 'cn'});
      let simplifiedQuery = converter(query);
      let matched = "";
      let priorityMatch = "";
      let secondaryMatch = "";
      let checkedSubQueries = new Set();

      // 优先匹配完整的频道名
      for (let epg of epglists) {
        if (epg.toUpperCase() === simplifiedQuery.toUpperCase()) {
          return epg;
        }
      }

      // 前缀匹配
      for (let epg of epglists) {
        let upperEPG = epg.toUpperCase();
        if (upperEPG.startsWith(simplifiedQuery.toUpperCase())) {
          if (this.isChinesePrefix(epg)) {
            if (!priorityMatch) {
              priorityMatch = epg;
            }
          } else {
            if (!secondaryMatch) {
              secondaryMatch = epg;
            }
          }
        }
      }

      // 如果有优先匹配的中文结果，则返回
      if (priorityMatch) {
        return priorityMatch;
      }

      // 如果有次要匹配的非中文结果，则返回
      if (secondaryMatch) {
        return secondaryMatch;
      }

      // 次级匹配：逐渐减少字符数进行匹配
      for (let i = simplifiedQuery.length; i > 0; i--) {
        let subQuery = simplifiedQuery.slice(0, i);

        // 检查是否已经处理过这个子字符串
        if (checkedSubQueries.has(subQuery)) {
          continue;
        }
        checkedSubQueries.add(subQuery);

        for (let epg of epglists) {
          if (epg.includes(subQuery)) {
            if (subQuery.length > matched.length) {
              matched = epg;
            }
          }
        }
      }

      return matched || "未知频道";
    },

    isChinesePrefix(s) {
      const re = /^\p{Script=Han}/u
      return re.test(s)
    },

    isValidIptvLine(iptv, line) {
      return iptv && iptv.length >= 2 && iptv[0] && iptv[1] && iptv[1] !== "undefined" && !line.includes('genre')
    },

    determineGroupName(channelName) {
      const channelGroups = {
        央视: ['CCTV', '央视', '中央', 'CGTN'],
        卫视: ['卫视'],
        北京: ['BTV'],
        港澳台: ['翡翠', '明珠', '民视', '台视', '华视', 'TVB', '纬来', '年代', '原住民', '中视', '澳亚', '东森', '好消息电视台', '大爱', '博斯', 'ELEVEN', 'FOX', 'ASTRO', 'HBO', 'NIPPON', 'NHK', 'GSTV', '无线'],
        香港: ['凤凰']
      }

      for (let [group, keywords] of Object.entries(channelGroups)) {
        if (keywords.some(keyword => channelName.toUpperCase().includes(keyword))) {
          return group
        }
      }
      return "其他"
    },

    adjustGroupNameBasedOnRegion(channelName, currentGroup) {
      const regionKeywords = /北京|上海|NEWTV|IHOT|河北|山西|辽宁|吉林|黑龙江|江苏|浙江|安徽|福建|江西|山东|河南|湖北|湖南|广东|海南|四川|贵州|云南|陕西|甘肃|青海|台湾|香港|重庆/g
      const match = channelName.toUpperCase().match(regionKeywords)
      return match ? match[0] : currentGroup
    },

    sanitizeChannelName(channel) {
      let tid = channel.toUpperCase()
          .replace(/\[.*?\]|[0-9\.]+M|[0-9]{3,4}[pP]|[0-9\.]+FPS/g, "") // 移除特定字符和模式
          .trim()
          .replace(/超清|高清$|蓝光|频道$|标清|FHD|HD$|HEVC|HDR|-|\s+/g, "") // 移除不必要的描述和空格
          .trim()

      if (tid.includes('CCTV') && !tid.includes('CCTV4K')) {
        let matches = tid.match(/CCTV[0-9+]{1,2}[48]?K?/);
        if (matches) {
          tid = matches[0].replace(/4K/, "");
        } else {
          matches = tid.match(/CCTV[^0-9]+/);
          if (matches) {
            tid = matches[0].replace(/CCTV/g, "");
          }
        }
      } else {
        tid = tid.replace(/BTV/g, "北京");
      }

      return tid;
    },
    m3uToTxt() {
      const source = this.source.replace(/[\r\n]+/g, '@')
      const matches = source.match(/#EXTINF:-1(?:,tvg-id="[^"]*")?(?: tvg-name="[^"]*")?(?: tvg-logo="[^"]*")?(?: group-title="([^"]*)")?,([^@]+)@([^@]+)/g)
      if (!matches) return ''

      let groups = {}
      matches.forEach(match => {
        const [, group = '自定义', name, url] = match.match(/#EXTINF:-1(?:,tvg-id="[^"]*")?(?: tvg-name="[^"]*")?(?: tvg-logo="[^"]*")?(?: group-title="([^"]*)")?,([^@]+)@([^@]+)/)
        if (!groups[group]) groups[group] = []
        groups[group].push(`${name},${url}`)
      })

      let result = ''
      for (const [group, channels] of Object.entries(groups)) {
        result += `${group},#genre#\n\n`
        result += channels.join('\n') + '\n\n'
      }

      this.result = result.trim()
      if (result) this.$message.success('转换为 txt 成功')
    },
    download() {
      const blob = new Blob([this.result], {type: 'text/plain;charset=utf-8'})
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = this.isTxtFormat ? 'myiptv.m3u' : 'myiptv.txt'
      link.click()
      URL.revokeObjectURL(link.href)
    }
  }
}

</script>

<style>
@import './assets/styles.css';
</style>
