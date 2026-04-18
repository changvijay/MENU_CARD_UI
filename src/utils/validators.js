/**
 * Form validators for admin panel
 */

export const validateIngredient = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateAllergen = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCategory = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Name must be less than 100 characters';
  }

  if (!data.slug || !data.slug.trim()) {
    errors.slug = 'Slug is required';
  } else if (!/^[a-z0-9-_]+$/.test(data.slug)) {
    errors.slug = 'Slug must contain only lowercase letters, numbers, hyphens, and underscores';
  }

  if (data.displayOrder !== undefined && data.displayOrder !== null) {
    if (isNaN(data.displayOrder) || data.displayOrder < 0) {
      errors.displayOrder = 'Display order must be a non-negative number';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateFoodItem = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length > 200) {
    errors.name = 'Name must be less than 200 characters';
  }

  if (!data.description || !data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length > 1000) {
    errors.description = 'Description must be less than 1000 characters';
  }

  if (!data.price && data.price !== 0) {
    errors.price = 'Price is required';
  } else if (isNaN(data.price) || data.price <= 0) {
    errors.price = 'Price must be a positive number';
  }

  if (!data.categoryId) {
    errors.categoryId = 'Primary category is required';
  }

  if (data.spiceLevel !== undefined && data.spiceLevel !== null) {
    if (isNaN(data.spiceLevel) || data.spiceLevel < 0 || data.spiceLevel > 10) {
      errors.spiceLevel = 'Spice level must be between 0 and 10';
    }
  }

  if (data.preparationTimeMin !== undefined && data.preparationTimeMin !== null) {
    if (isNaN(data.preparationTimeMin) || data.preparationTimeMin < 0) {
      errors.preparationTimeMin = 'Preparation time must be a non-negative number';
    }
  }

  if (data.calories !== undefined && data.calories !== null) {
    if (isNaN(data.calories) || data.calories < 0) {
      errors.calories = 'Calories must be a non-negative number';
    }
  }

  if (data.displayOrder !== undefined && data.displayOrder !== null) {
    if (isNaN(data.displayOrder) || data.displayOrder < 0) {
      errors.displayOrder = 'Display order must be a non-negative number';
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

// Operations validators

export const validateCashFlowCategory = (data) => {
  const errors = {};

  if (!data.name || !data.name.trim()) {
    errors.name = 'Category name is required';
  } else if (data.name.length > 100) {
    errors.name = 'Category name must be less than 100 characters';
  }

  if (!data.type || !['income', 'expense'].includes(data.type)) {
    errors.type = 'Category type must be either income or expense';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCashFlow = (data) => {
  const errors = {};

  if (!data.description || !data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length > 500) {
    errors.description = 'Description must be less than 500 characters';
  }

  if (!data.amount && data.amount !== 0) {
    errors.amount = 'Amount is required';
  } else if (isNaN(data.amount)) {
    errors.amount = 'Amount must be a valid number';
  }

  if (!data.category || !data.category.trim()) {
    errors.category = 'Category is required';
  }

  if (!data.type || !['income', 'expense'].includes(data.type)) {
    errors.type = 'Transaction type must be either income or expense';
  }

  if (!data.date || !data.date.trim()) {
    errors.date = 'Date is required';
  } else {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.date)) {
      errors.date = 'Date must be in YYYY-MM-DD format';
    } else {
      const selectedDate = new Date(data.date);
      const today = new Date();
      if (selectedDate > today) {
        errors.date = 'Date cannot be in the future';
      }
    }
  }

  // Optional fields - validate if provided
  if (data.referenceId && data.referenceId.toString().trim() && isNaN(data.referenceId)) {
    errors.referenceId = 'Reference ID must be a valid number';
  }

  if (data.createdBy && data.createdBy.toString().trim() && isNaN(data.createdBy)) {
    errors.createdBy = 'Created By ID must be a valid number';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateCafeTable = (data) => {
  const errors = {};

  if (!data.tableNumber || !data.tableNumber.toString().trim()) {
    errors.tableNumber = 'Table number is required';
  } else if (data.tableNumber.toString().length > 10) {
    errors.tableNumber = 'Table number must be less than 10 characters';
  }

  if (data.qrCodeUrl && data.qrCodeUrl.trim()) {
    try {
      new URL(data.qrCodeUrl);
    } catch {
      errors.qrCodeUrl = 'QR Code URL must be a valid URL';
    }
  }

  // isActive is a boolean, so we don't need to validate it extensively
  if (data.isActive !== undefined && typeof data.isActive !== 'boolean') {
    errors.isActive = 'Active status must be true or false';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateInventoryTransaction = (data) => {
  const errors = {};

  if (!data.ingredientId) {
    errors.ingredientId = 'Inventory item is required';
  }

  if (!data.quantityChange && data.quantityChange !== 0) {
    errors.quantityChange = 'Quantity is required';
  } else if (isNaN(data.quantityChange) || parseFloat(data.quantityChange) === 0) {
    errors.quantityChange = 'Quantity must be a non-zero number';
  }

  if (!data.type || !['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT'].includes(data.type)) {
    errors.type = 'Transaction type must be STOCK_IN, STOCK_OUT, or ADJUSTMENT';
  }

  if (!data.createdBy || isNaN(data.createdBy)) {
    errors.createdBy = 'Created by is required and must be a valid user ID';
  }

  if (data.cost && (isNaN(data.cost) || parseFloat(data.cost) < 0)) {
    errors.cost = 'Cost must be a valid positive number';
  }

  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Notes must be less than 500 characters';
  }

  if (data.minThreshold && (isNaN(data.minThreshold) || parseFloat(data.minThreshold) < 0)) {
    errors.minThreshold = 'Minimum threshold must be a valid positive number';
  }

  if (data.costPerUnit && (isNaN(data.costPerUnit) || parseFloat(data.costPerUnit) < 0)) {
    errors.costPerUnit = 'Cost per unit must be a valid positive number';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
