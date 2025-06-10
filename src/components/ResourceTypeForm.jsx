import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Plus, X, Users } from 'lucide-react';

const ResourceTypeForm = ({ isOpen, onClose, onSave, editingResourceType = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    hourlyRate: '',
    capacity: '',
    color: '#3B82F6'
  });

  // Update form data when editingResourceType changes
  useEffect(() => {
    if (editingResourceType) {
      setFormData({
        name: editingResourceType.name || '',
        hourlyRate: editingResourceType.hourlyRate || '',
        capacity: editingResourceType.capacity || '',
        color: editingResourceType.color || '#3B82F6'
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: '',
        hourlyRate: '',
        capacity: '',
        color: '#3B82F6'
      });
    }
  }, [editingResourceType]);

  const predefinedColors = [
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Amber
    '#06B6D4', // Cyan
    '#84CC16', // Lime
    '#EF4444', // Red
    '#F97316', // Orange
    '#6366F1'  // Indigo
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    if (formData.name.trim() && formData.hourlyRate && formData.capacity) {
      const resourceType = {
        id: editingResourceType?.id || `rt-${Date.now()}`,
        name: formData.name.trim(),
        hourlyRate: parseFloat(formData.hourlyRate),
        capacity: parseInt(formData.capacity),
        color: formData.color
      };
      
      onSave(resourceType);
      
      // Reset form
      setFormData({
        name: '',
        hourlyRate: '',
        capacity: '',
        color: '#3B82F6'
      });
      
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>{editingResourceType ? 'Edit Resource Type' : 'Add New Resource Type'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="rtName">Resource Type Name *</Label>
            <Input
              id="rtName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Senior Developers, UX Designers"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rtRate">Hourly Rate ($) *</Label>
              <Input
                id="rtRate"
                type="number"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                placeholder="100"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="rtCapacity">Total Capacity *</Label>
              <Input
                id="rtCapacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => handleInputChange('capacity', e.target.value)}
                placeholder="10"
                min="1"
              />
              <div className="text-xs text-gray-500 mt-1">Available people</div>
            </div>
          </div>
          
          <div>
            <Label>Color</Label>
            <div className="flex items-center space-x-2 mt-2">
              <div 
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: formData.color }}
              />
              <Input
                type="color"
                value={formData.color}
                onChange={(e) => handleInputChange('color', e.target.value)}
                className="w-16 h-8 p-1 border rounded"
              />
            </div>
            
            <div className="grid grid-cols-5 gap-2 mt-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color === color ? 'border-gray-800' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleInputChange('color', color)}
                />
              ))}
            </div>
          </div>
          
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="text-sm font-medium mb-2">Preview</div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="font-medium">{formData.name || 'Resource Type'}</span>
              </div>
              <div className="text-sm text-gray-600">
                ${formData.hourlyRate || '0'}/hr • {formData.capacity || '0'} people
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.hourlyRate || !formData.capacity}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {editingResourceType ? 'Update' : 'Create'} Resource Type
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResourceTypeForm;

