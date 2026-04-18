import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle2, 
  Upload,
  X,
  Plus,
  Search 
} from 'lucide-react';
import * as z from 'zod';

// Validation schema using Zod
const foodItemSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  description: z.string()
    .min(1, 'Description is required') 
    .max(1000, 'Description must be less than 1000 characters'),
  price: z.number({ required_error: 'Price is required' })
    .min(0.01, 'Price must be greater than 0'),
  categoryId: z.string()
    .min(1, 'Primary category is required'),
  categoryIds: z.array(z.string()).optional(),
  allergenIds: z.array(z.string()).optional(),
  ingredientIds: z.array(z.string()).optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  spiceLevel: z.number().min(0).max(10).optional(),
  preparationTimeMin: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  available: z.boolean().optional(),
  displayOrder: z.number().min(0).optional(),
  image: z.any().optional(),
});

/**
 * Modern Food Item Form with advanced validation and UX
 */
export const ModernFoodItemForm = ({ 
  initialData, 
  onSubmit, 
  onCancel,
  categories = [],
  allergens = [],
  ingredients = [],
  loading = false 
}) => {
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid, touchedFields }
  } = useForm({
    resolver: zodResolver(foodItemSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      categoryId: initialData?.categoryId || '',
      categoryIds: initialData?.categoryIds || [],
      allergenIds: initialData?.allergenIds || [],
      ingredientIds: initialData?.ingredientIds || [],
      isVegan: initialData?.isVegan || false,
      isGlutenFree: initialData?.isGlutenFree || false,
      spiceLevel: initialData?.spiceLevel || 0,
      preparationTimeMin: initialData?.preparationTimeMin || '',
      calories: initialData?.calories || '',
      available: initialData?.available !== false,
      displayOrder: initialData?.displayOrder || 0,
      image: null,
    },
    mode: 'onBlur'
  });

  const watchedName = watch('name');
  const watchedSpiceLevel = watch('spiceLevel');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Form Header */}
        <div className="text-center pb-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? 'Edit Food Item' : 'Add New Food Item'}
          </h2>
          <p className="text-gray-600 mt-2">
            Fill in the details below to {initialData ? 'update' : 'create'} your food item
          </p>
        </div>

        {/* Basic Information */}
        <FormSection title="Basic Information" icon="📝">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <SmartTextField
                  {...field}
                  label="Item Name"
                  placeholder="e.g. Margherita Pizza"
                  error={errors.name?.message}
                  touched={touchedFields.name}
                  showCharacterCount
                  maxLength={200}
                  required
                />
              )}
            />

            {/* Price Field */}
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <SmartNumberField
                  {...field}
                  label="Price"
                  placeholder="0.00"
                  prefix="$"
                  step={0.01}
                  error={errors.price?.message}
                  touched={touchedFields.price}
                  required
                />
              )}
            />
          </div>

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <SmartTextArea
                {...field}
                label="Description"
                placeholder="Describe your food item..."
                error={errors.description?.message}
                touched={touchedFields.description}
                showCharacterCount
                maxLength={1000}
                rows={4}
                required
              />
            )}
          />
        </FormSection>

        {/* Categories */}
        <FormSection title="Categorization" icon="📁">
          <div className="space-y-6">
            {/* Primary Category */}
            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <SmartSelect
                  {...field}
                  label="Primary Category"
                  placeholder="Select a category"
                  options={categories}
                  error={errors.categoryId?.message}
                  touched={touchedFields.categoryId}
                  required
                />
              )}
            />

            {/* Additional Categories */}
            <Controller
              name="categoryIds"
              control={control}
              render={({ field }) => (
                <SmartMultiSelect
                  {...field}
                  label="Additional Categories"
                  placeholder="Select additional categories (optional)"
                  options={categories}
                  description="Select multiple categories to make this item appear in different sections"
                />
              )}
            />
          </div>
        </FormSection>

        {/* Dietary & Allergen Information */}
        <FormSection title="Dietary & Allergen Information" icon="🥗">
          <div className="space-y-6">
            {/* Dietary Tags */}
            <div className="flex gap-6">
              <Controller
                name="isVegan"
                control={control}
                render={({ field }) => (
                  <SmartCheckbox
                    {...field}
                    label="Vegan"
                    description="Contains no animal products"
                    icon="🌱"
                  />
                )}
              />

              <Controller
                name="isGlutenFree"
                control={control}
                render={({ field }) => (
                  <SmartCheckbox
                    {...field}
                    label="Gluten-Free"
                    description="Safe for celiac disease"
                    icon="🌾"
                  />
                )}
              />

              <Controller
                name="available"
                control={control}
                render={({ field }) => (
                  <SmartCheckbox
                    {...field}
                    label="Available"
                    description="Currently available for ordering"
                    icon="✅"
                  />
                )}
              />
            </div>

            {/* Allergens */}
            <Controller
              name="allergenIds"
              control={control}
              render={({ field }) => (
                <SmartTagSelect
                  {...field}
                  label="Allergens"
                  placeholder="Select allergens present in this item"
                  options={allergens}
                  color="red"
                />
              )}
            />

            {/* Ingredients */}
            <Controller
              name="ingredientIds"
              control={control}
              render={({ field }) => (
                <SmartTagSelect
                  {...field}
                  label="Ingredients"
                  placeholder="Select main ingredients"
                  options={ingredients}
                  color="green"
                />
              )}
            />
          </div>
        </FormSection>

        {/* Additional Details */}
        <FormSection title="Additional Details" icon="📊">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Spice Level Slider */}
            <div className="md:col-span-3">
              <Controller
                name="spiceLevel"
                control={control}
                render={({ field }) => (
                  <SmartSlider
                    {...field}
                    label="Spice Level"
                    min={0}
                    max={10}
                    step={1}
                    showValue
                    color="red"
                    icon="🌶️"
                  />
                )}
              />
            </div>

            <Controller
              name="preparationTimeMin"
              control={control}
              render={({ field }) => (
                <SmartNumberField
                  {...field}
                  label="Prep Time"
                  placeholder="15"
                  suffix="minutes"
                  min={0}
                  error={errors.preparationTimeMin?.message}
                />
              )}
            />

            <Controller
              name="calories"
              control={control}
              render={({ field }) => (
                <SmartNumberField
                  {...field}
                  label="Calories"
                  placeholder="250"
                  suffix="kcal"
                  min={0}
                  error={errors.calories?.message}
                />
              )}
            />

            <Controller
              name="displayOrder"
              control={control}
              render={({ field }) => (
                <SmartNumberField
                  {...field}
                  label="Display Order"
                  placeholder="0"
                  min={0}
                  error={errors.displayOrder?.message}
                />
              )}
            />
          </div>
        </FormSection>

        {/* Image Upload */}
        <FormSection title="Item Image" icon="📷">
          <Controller
            name="image"
            control={control}
            render={({ field }) => (
              <SmartFileUpload
                {...field}
                label="Food Item Image"
                accept="image/*"
                previewUrl={initialData?.imageUrl}
                required={!initialData}
                description="Upload a high-quality image of your food item (max 5MB)"
              />
            )}
          />
        </FormSection>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancel
          </button>

          <motion.button
            type="submit"
            disabled={!isValid || loading}
            whileHover={{ scale: isValid ? 1.02 : 1 }}
            whileTap={{ scale: isValid ? 0.98 : 1 }}
            className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isValid && !loading
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {initialData ? 'Update Item' : 'Create Item'}
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
};

/**
 * Form section with collapsible content
 */
const FormSection = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        {title}
      </h3>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);