import styles from './index.lazy.scss'

export const jianshu = ({ store, createControl }) => ({
  handler() {
    createControl({ store, execute: styles.use })
  },
})
