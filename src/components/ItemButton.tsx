import { Item } from '../types';
import styles from './ItemButton.module.css';

interface Props {
  item: Item;
  onClick: (item: Item) => void;
  /** When provided the button shows a CSS countdown bar (column mode). */
  addedAt?: number;
}

export function ItemButton({ item, onClick, addedAt }: Props) {
  const isInColumn = addedAt !== undefined;

  return (
    <button
      className={`${styles.btn} ${isInColumn ? styles.column : styles.list}`}
      onClick={() => onClick(item)}
    >
      <span className={styles.label}>{item.name}</span>
      {isInColumn && (
        <span
          key={addedAt}
          className={styles.progress}
          style={{ animationDuration: '5s' }}
        />
      )}
    </button>
  );
}
