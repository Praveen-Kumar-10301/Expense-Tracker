import Category from '../models/Category.js';

export async function listCategories(req, res) {
  const { userId } = req.user;
  const categories = await Category.findByUser(userId);
  res.json({ categories });
}

export async function createCategory(req, res) {
  const { userId } = req.user;
  const { name, color = '#6366f1' } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(422).json({ error: 'Category name is required', code: 422 });
  }

  try {
    const id = await Category.create(userId, name.trim(), color);
    const category = await Category.findById(id, userId);
    res.status(201).json({ category });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(422).json({ error: 'A category with this name already exists', code: 422 });
    }
    throw err;
  }
}

export async function updateCategory(req, res) {
  const { userId } = req.user;
  const id = parseInt(req.params.id, 10);
  const { name, color } = req.body ?? {};

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(422).json({ error: 'Category name is required', code: 422 });
  }

  const existing = await Category.findById(id, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Category not found', code: 404 });
  }

  try {
    await Category.update(id, userId, name.trim(), color ?? existing.color);
    const category = await Category.findById(id, userId);
    res.json({ category });
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return res.status(422).json({ error: 'A category with this name already exists', code: 422 });
    }
    throw err;
  }
}

export async function deleteCategory(req, res) {
  const { userId } = req.user;
  const id = parseInt(req.params.id, 10);

  const existing = await Category.findById(id, userId);
  if (!existing) {
    return res.status(404).json({ error: 'Category not found', code: 404 });
  }

  try {
    await Category.delete(id, userId);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({ error: err.message, code: status });
  }
}
