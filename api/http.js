// let baseurl='https://apifoxmock.com/m1/4728220-0-default/api'

let baseurl = ''
if (process.env.NODE_ENV === 'development') {
	// baseurl = 'http://localhost:5173/api'
	baseurl = 'https://apifoxmock.com/m1/4728220-0-default/api'
} else {
	baseurl = 'https://apifoxmock.com/m1/4728220-0-default/api'
}


export default function http(url, data = {}, method = 'GET') {


	return new Promise((resolve, reject) => {
		uni.request({
			url: baseurl + url,
			data,
			method,
			header: {
				'token': uni.getStorageSync('token') || ''
			},
			success: res => {
				if (res.statusCode == 200) {
					if (res.data.code == 1) {
						resolve(res.data.data)
					} else if (res.data.code == 0) {
						uni.showToast({
							title: res.data.msg,
							icon: 'none'
						})
						reject(res.data.msg)
					}
				}
			},
			fail: () => {
				uni.showToast({
					title: '服务器请求异常',
					icon: 'none'
				})
			}
		})
	})
}