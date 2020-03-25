
      //* 定义vue
      function MyVue(option = {}) {
        //* 根节点
        this.$el = document.querySelector(option.el);
        //* myVue的data
        this.$data = option.data;
        //* 监测的数据
        this._watchTpl = {};
        //* 定义数据劫持
        this._observer(this.$data);
        //* 定义dom监测
        this._compile(this.$el);
      }
      //* 定义数据劫持
      MyVue.prototype._observer = function(data) {
        let _this = this;
        //* 遍历data
        Object.keys(data).forEach((item, index) => {
          //* item => data的key    name
          let value = data[item];
          //* _watchTpl[name] = []
          this._watchTpl[item] = [];
          //* 劫持data
          Object.defineProperty(data, item, {
            enumerable: true,
            configurable: true,

            get() {
              return value;
            },

            set(newVal) {
              if (newVal !== value) {
                value = newVal;
                //* 遍历所有绑定的dom，更新数据
                _this._watchTpl[item].forEach(item => {
                  item.update();
                });
              }
            }
          });
        });
      };
      //* 定义dom绑定数据方法
      MyVue.prototype._compile = function(el) {
        //* el是根节点dom
        let nodeList = el.children;
        //* 类数组 => 数组
        nodeList = Array.prototype.slice.call(nodeList);

        nodeList.forEach((node, index) => {
          //* 递归处理所有dom
          if (node.children) {
            this._compile(node);
          }
          //* dom包含属性v-modal
          if (node.getAttribute("v-model")) {
            //* 获取v-modal对应绑定的值
            let key = node.getAttribute("v-model");

            //* 未存在则创建
            if (!this._watchTpl[key].length) {
              this._watchTpl[key] = [];
            }

            //* 把input丢到监测数组中
            this._watchTpl[key].push(new Watcher(node, key, this, "value"));
            //* 监听input输入
            node.addEventListener("input", () => {
              this.$data[key] = node.value;
            });
          }

          //* 匹配 {{  }}
          let reg = /\{\{\s*([^}]+\S)\s*\}\}/g;
          //该正则表达式的含义:\s匹配任何空白字符,\S匹配任何非空白字符,*匹配任何包含零个或多个前导字符串,+匹配任何至少包含一个前导字符串
          //总的含义就是匹配以{{为开头，后面跟着零或多个空白符,}前面有至少一个非空白字符的以}为结尾的字符串

          //* 获取node下的所有内容（不包含node节点，只取text文本）
          let content = node.textContent;
          if (reg.test(content)) {
            //* matched：所匹配的内容，即content；placeholder：每个{{}}内的值，即 key

            // 这篇文章介绍了replace怎么用,我以前没怎么研究过replace这个语法。
            // https://blog.csdn.net/linbilin_/article/details/57094602
            content.replace(reg, (matched, placeholder) => {
              if (!this._watchTpl[placeholder].length) {
                this._watchTpl[placeholder] = [];
              }
              //* 把{{}}匹配到的dom丢到监测数组中
              this._watchTpl[placeholder].push(
                new Watcher(node, placeholder, this, "innerHTML")
              );
            });
          }
        });
      };
      //* 定义watcher
      function Watcher(node, key, vm, type) {
        //* dom
        this.node = node;
        //* key
        this.key = key;
        //* myVue
        this.vm = vm;
        //* value || innerHtml
        this.type = type;
        // 触发一次更新数据操作
        this.update();
      }
      //* 定义watcher更新方法
      Watcher.prototype.update = function() {
        //* dom.value = myVue.data[key] || dom.innerHtml = myVue.data[key]
        this.node[this.type] = this.vm.$data[this.key];
      };