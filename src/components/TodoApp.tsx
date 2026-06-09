import { useTodoList } from '../hooks/useTodoList';
import { MainList } from './MainList';
import { ColumnList } from './ColumnList';
import styles from './TodoApp.module.css';

export function TodoApp() {
  const { mainList, fruitItems, vegetableItems, moveToColumn, returnToMain } =
    useTodoList();

  return (
    <div className={styles.wrapper}>
      <MainList items={mainList} onItemClick={moveToColumn} />
      <div className={styles.divider} />
      <ColumnList type="Fruit"     items={fruitItems}     onItemClick={returnToMain} />
      <ColumnList type="Vegetable" items={vegetableItems} onItemClick={returnToMain} />
    </div>
  );
}
