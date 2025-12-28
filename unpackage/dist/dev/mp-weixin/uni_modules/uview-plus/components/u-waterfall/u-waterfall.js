"use strict";
const common_vendor = require("../../../../common/vendor.js");
const uni_modules_uviewPlus_libs_mixin_mpMixin = require("../../libs/mixin/mpMixin.js");
const uni_modules_uviewPlus_libs_mixin_mixin = require("../../libs/mixin/mixin.js");
const uni_modules_uviewPlus_libs_function_index = require("../../libs/function/index.js");
const _sfc_main = {
  name: "u-waterfall",
  props: {
    modelValue: {
      // 瀑布流数据
      type: Array,
      required: true,
      default: function() {
        return [];
      }
    },
    // 每次向结构插入数据的时间间隔，单位ms
    // 单位ms
    addTime: {
      type: [Number, String],
      default: 200
    },
    // id值，用于清除某一条数据时，根据此idKey名称找到并移除，如数据为{idx: 22, name: 'lisa'}
    // 那么该把idKey设置为idx
    idKey: {
      type: String,
      default: "id"
    },
    // 瀑布流列数
    columns: {
      type: [Number, String],
      default: 2
    },
    // 瀑布流最小列数
    columnsMin: {
      type: [Number, String],
      default: 2
    },
    // 最小列宽
    minColumnWidth: {
      type: Number,
      default: 230
    }
  },
  mixins: [uni_modules_uviewPlus_libs_mixin_mpMixin.mpMixin, uni_modules_uviewPlus_libs_mixin_mixin.mixin],
  data() {
    return {
      columnList: [[]],
      // 存储每列的数据
      children: [],
      // 用于标记是否已经初始化
      initialized: false,
      windowWidth: 375,
      windowHeight: 0
    };
  },
  watch: {
    copyFlowList: {
      handler(nVal, oVal) {
        if (!nVal || nVal.length == 0) {
          this.clear(false);
        } else {
          if (this.columnList.length == 1) {
            this.initColumnList();
          }
          let startIndex = Array.isArray(oVal) && oVal.length > 0 ? oVal.length : 0;
          this.handleData(nVal.slice(startIndex));
        }
      },
      immediate: true
    },
    columns: {
      handler() {
        this.initColumnList();
        if (this.copyFlowList.length > 0) {
          this.redistributeData();
        }
      },
      immediate: false
    }
  },
  created() {
    this.initColumnList();
  },
  mounted() {
    this.initialized = true;
  },
  // 添加beforeUnmount生命周期清理事件监听
  beforeUnmount() {
  },
  computed: {
    // 破坏flowList变量的引用，否则watch的结果新旧值是一样的
    copyFlowList() {
      if (!this.modelValue || this.modelValue.length == 0) {
        return [];
      } else {
        return this.cloneData(this.modelValue);
      }
    }
  },
  emits: ["update:modelValue", "after-add-one", "after-add-all"],
  methods: {
    // 初始化列数据数组
    initColumnList() {
      this.windowWidth = common_vendor.index.getSystemInfoSync().windowWidth;
      const cols = this.getColumnsCount();
      this.columnList = Array.from({ length: cols }, () => []);
    },
    // 获取列数，支持auto模式
    getColumnsCount() {
      if (this.columns === "auto") {
        const columnGap = 7;
        let columnCount = Math.max(1, Math.floor(this.windowWidth / (this.minColumnWidth + columnGap)));
        if (columnCount < this.columnsMin) {
          columnCount = this.columnsMin;
        }
        return columnCount;
      }
      return parseInt(this.columns) || 2;
    },
    // 窗口大小变化处理函数
    handleWindowResize(res) {
      this.windowWidth = res.size.windowWidth;
      this.windowHeight = res.size.windowHeight;
      if (this.resizeTimer) {
        clearTimeout(this.resizeTimer);
      }
      this.resizeTimer = setTimeout(() => {
        const newColumnsCount = this.getColumnsCount();
        const oldColumnsCount = this.columnList.length;
        if (newColumnsCount !== oldColumnsCount) {
          this.redistributeData();
        }
      }, 300);
    },
    // 重新分配所有数据
    async redistributeData() {
      this.initColumnList();
      const allData = this.cloneData(this.copyFlowList);
      this.handleData(allData);
    },
    // 处理新增数据
    async handleData(newData) {
      if (!newData || newData.length === 0)
        return;
      const columnHeights = new Array(this.columnList.length).fill(0);
      for (let i = 0; i < this.columnList.length; i++) {
        try {
          const rect = await this.$uGetRect(`#u-column-${i}`);
          columnHeights[i] = rect.height || 0;
        } catch (e) {
          columnHeights[i] = 0;
        }
      }
      for (let item of newData) {
        const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights));
        this.columnList[minHeightIndex].push(item);
        await uni_modules_uviewPlus_libs_function_index.sleep(this.addTime);
        await this.$nextTick(async () => {
          try {
            const rect = await this.$uGetRect(`#u-column-${minHeightIndex}`);
            if (rect.height) {
              columnHeights[minHeightIndex] = rect.height;
              this.$emit("after-add-one", {
                ...item,
                height: rect.height
              });
            }
          } catch (e) {
          }
        });
      }
      this.$emit("after-add-all", {
        columnHeights,
        newData
      });
    },
    // 复制而不是引用对象和数组
    cloneData(data) {
      return JSON.parse(JSON.stringify(data));
    },
    // 清空数据列表
    clear(bak = true) {
      this.initColumnList();
      if (bak) {
        this.$emit("update:modelValue", []);
      }
    },
    // 清除某一条指定的数据，根据id实现
    remove(id) {
      for (let i = 0; i < this.columnList.length; i++) {
        const index = this.columnList[i].findIndex((val) => val[this.idKey] == id);
        if (index !== -1) {
          this.columnList[i].splice(index, 1);
          break;
        }
      }
      const modelValueIndex = this.modelValue.findIndex((val) => val[this.idKey] == id);
      if (modelValueIndex !== -1) {
        const newModelValue = this.cloneData(this.modelValue);
        newModelValue.splice(modelValueIndex, 1);
        this.$emit("update:modelValue", newModelValue);
      }
    },
    // 修改某条数据的某个属性
    modify(id, key, value) {
      let found = false;
      let targetItem = null;
      for (let i = 0; i < this.columnList.length; i++) {
        const index = this.columnList[i].findIndex((val) => val[this.idKey] == id);
        if (index !== -1) {
          this.columnList[i][index][key] = value;
          targetItem = this.columnList[i][index];
          found = true;
          break;
        }
      }
      if (found && targetItem) {
        const modelValueIndex = this.modelValue.findIndex((val) => val[this.idKey] == id);
        if (modelValueIndex !== -1) {
          let data = this.cloneData(this.modelValue);
          data[modelValueIndex][key] = value;
          this.$emit("update:modelValue", data);
        }
      }
    }
  }
};
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  return {
    a: common_vendor.f($data.columnList, (column, index, i0) => {
      return common_vendor.e({
        a: "column-" + i0,
        b: common_vendor.r("column", {
          colIndex: index,
          colList: column
        }, i0),
        c: "left-" + i0,
        d: common_vendor.r("left", {
          colIndex: index,
          leftList: column
        }, i0)
      }, !_ctx.$slots["left"] && !_ctx.$slots["column"] ? {
        e: common_vendor.f(column, (item, itemIndex, i1) => {
          return {
            a: "d-" + i0 + "-" + i1,
            b: common_vendor.r("d", {
              item,
              itemIndex
            }, i0 + "-" + i1),
            c: itemIndex
          };
        })
      } : {}, {
        f: index,
        g: `u-column-${index}`,
        h: `u-column-${index}`
      });
    }),
    b: !_ctx.$slots["left"] && !_ctx.$slots["column"]
  };
}
const Component = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["render", _sfc_render], ["__scopeId", "data-v-366bbda3"]]);
wx.createComponent(Component);
//# sourceMappingURL=../../../../../.sourcemap/mp-weixin/uni_modules/uview-plus/components/u-waterfall/u-waterfall.js.map
