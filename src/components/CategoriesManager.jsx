import { motion, Reorder } from 'framer-motion'
import { Plus, GripVertical, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'

export function CategoriesManager({
  categories = [],
  onReorder = () => {},
  onAddCustom = () => {},
  onRemoveCustom = () => {},
}) {
  const [isReordering, setIsReordering] = useState(false)
  const [items, setItems] = useState(categories)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', color: '#0369a1', icon: '📌' })

  useEffect(() => {
    setItems(categories)
  }, [categories])

  const handleReorderComplete = () => {
    const newOrder = items.map((item) => item.id)
    onReorder(newOrder)
    setIsReordering(false)
  }

  const handleAddCategory = (e) => {
    e.preventDefault()
    if (newCategory.name.trim()) {
      onAddCustom(newCategory)
      setItems((prev) => [...prev, { id: `custom_${Date.now()}`, ...newCategory, isCustom: true }])
      setNewCategory({ name: '', color: '#0369a1', icon: '📌' })
      setShowAddForm(false)
    }
  }

  const handleRemoveCategory = (categoryId) => {
    setItems((prev) => prev.filter((item) => item.id !== categoryId))
    onRemoveCustom(categoryId)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300">Categorias</h3>
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsReordering(!isReordering)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              isReordering
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
            }`}
          >
            {isReordering ? 'Pronto' : 'Reordenar'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 rounded-lg bg-green-500/20 px-3 py-1 text-xs font-medium text-green-400 hover:bg-green-500/30"
          >
            <Plus size={14} />
            Adicionar
          </motion.button>
        </div>
      </div>

      {showAddForm && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleAddCategory}
          className="overflow-hidden rounded-lg border border-green-500/20 bg-green-500/5 p-3"
        >
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Nome da categoria"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full rounded-lg border border-slate-600 bg-slate-700/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-green-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ícone"
                value={newCategory.icon}
                onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                maxLength="2"
                className="w-12 rounded-lg border border-slate-600 bg-slate-700/50 px-2 py-2 text-center text-sm focus:border-green-500 focus:outline-none"
              />
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="h-9 w-16 cursor-pointer rounded-lg"
              />
              <button
                type="submit"
                className="flex-1 rounded-lg bg-green-500/30 text-sm font-medium text-green-400 hover:bg-green-500/40"
              >
                Criar
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {isReordering ? (
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {items.map((category) => (
              <Reorder.Item key={category.id} value={category}>
                <motion.div
                  variants={itemVariants}
                  whileDrag={{ scale: 1.02, backgroundColor: 'rgba(15, 23, 42, 0.8)' }}
                  className="flex cursor-grab items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 active:cursor-grabbing"
                >
                  <GripVertical size={16} className="text-slate-500" />
                  <span className="text-lg">{category.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{category.name}</p>
                  </div>
                  {category.isCustom ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category.id)}
                      className="rounded-md border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 transition hover:bg-red-500/20"
                      title="Excluir categoria personalizada"
                    >
                      <Trash2 size={12} />
                    </button>
                  ) : (
                    <span className="text-xs text-blue-400">Padrão</span>
                  )}
                </motion.div>
              </Reorder.Item>
            ))}
          </motion.div>
        </Reorder.Group>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 gap-2 sm:grid-cols-3"
        >
          {items.map((category) => (
            <motion.div
              key={category.id}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-center"
            >
              <span className="block h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
              <div className="flex-1">
                <p className="text-lg">{category.icon}</p>
                <p className="text-xs text-slate-400">{category.name}</p>
              </div>
              {category.isCustom && (
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(category.id)}
                  className="rounded-md border border-red-500/30 bg-red-500/10 p-1.5 text-red-300 transition hover:bg-red-500/20"
                  title="Excluir categoria personalizada"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {isReordering && (
        <button
          type="button"
          onClick={handleReorderComplete}
          className="w-full rounded-lg bg-cyan-500/20 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-cyan-500/30"
        >
          Salvar ordem
        </button>
      )}
    </div>
  )
}
