import { defineComponent, computed, ref, unref } from 'vue';
import { Descriptions } from 'ant-design-vue';
import { CollapseContainer, CollapseContainerOptions } from '/@/components/Container/index';
import type { DescOptions, DescInstance, DescItem } from './types';
import descProps from './props';

import { isFunction } from '/@/utils/is';
import { getSlot } from '/@/utils/helper/tsxHelper';
import { cloneDeep } from 'lodash-es';
import { deepMerge } from '/@/utils';

const prefixCls = 'description';
export default defineComponent({
  props: descProps,
  emits: ['register'],
  setup(props, { attrs, slots, emit }) {
    // props来自设置
    const propsRef = ref<Partial<DescOptions> | null>(null);
    // 自定义title组件：获得title
    const getMergeProps = computed(() => {
      return {
        ...props,
        ...unref(propsRef),
      };
    });

    const getProps = computed(() => {
      const opt = {
        ...props,
        ...(unref(propsRef) || {}),
        title: undefined,
      };
      return opt;
    });

    /**
     * @description: 是否使用标题
     */
    const useWrapper = computed(() => {
      return !!unref(getMergeProps).title;
    });

    /**
     * @description: 获取配置Collapse
     */
    const getCollapseOptions = computed(
      (): CollapseContainerOptions => {
        return {
          // 默认不能展开
          canExpand: false,
          ...unref(getProps).collapseOptions,
        };
      }
    );

    /**
     * @description:设置desc
     */
    function setDescProps(descProps: Partial<DescOptions>): void {
      // 保留上一次的setDrawerProps
      const mergeProps = deepMerge(unref(propsRef) || {}, descProps);
      propsRef.value = cloneDeep(mergeProps);
    }

    const methods: DescInstance = {
      setDescProps,
    };

    emit('register', methods);

    // 防止换行
    function renderLabel({ label, labelMinWidth, labelStyle }: DescItem) {
      if (!labelStyle && !labelMinWidth) {
        return label;
      }
      return (
        <div
          style={{
            ...labelStyle,

            minWidth: `${labelMinWidth}px`,
          }}
        >
          {label}
        </div>
      );
    }

    function renderItem() {
      const { schema } = unref(getProps);
      return unref(schema).map((item) => {
        const { render, field, span, show, contentMinWidth } = item;
        const { data } = unref(getProps) as any;
        if (show && isFunction(show) && !show(data)) {
          return null;
        }
        const getContent = () =>
          isFunction(render)
            ? render(data && data[field], data)
            : unref(data) && unref(data)[field];

        const width = contentMinWidth;
        return (
          // @ts-ignore
          <Descriptions.Item label={renderLabel(item)} key={field} span={span}>
            {() =>
              contentMinWidth ? (
                <div
                  style={{
                    minWidth: `${width}px`,
                  }}
                >
                  {getContent()}
                </div>
              ) : (
                getContent()
              )
            }
          </Descriptions.Item>
        );
      });
    }

    const renderDesc = () => {
      return (
        <Descriptions class={`${prefixCls}`} {...{ ...attrs, ...(unref(getProps) as any) }}>
          {() => renderItem()}
        </Descriptions>
      );
    };

    const renderContainer = () => {
      const content = props.useCollapse ? renderDesc() : <div>{renderDesc()}</div>;
      // 减少dom层级
      return props.useCollapse ? (
        <CollapseContainer
          title={unref(getMergeProps).title}
          canExpan={unref(getCollapseOptions).canExpand}
          helpMessage={unref(getCollapseOptions).helpMessage}
        >
          {{
            default: () => content,
            action: () => getSlot(slots, 'action'),
          }}
        </CollapseContainer>
      ) : (
        content
      );
    };

    return () => (unref(useWrapper) ? renderContainer() : renderDesc());
  },
});
