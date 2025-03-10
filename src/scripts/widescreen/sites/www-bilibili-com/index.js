import styles from './index.lazy.scss'

export const bilibili = ({ store, createControl }) => ({
  handler() {
    createControl({ store, execute: styles.use })
  },
})
