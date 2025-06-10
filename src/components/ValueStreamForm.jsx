import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Plus, X, Palette, User, BarChart2 } from 'lucide-react';

const ValueStreamForm = ({ isOpen, onClose, onSave, editingValueStream = null }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8B5CF6',
    primaryStakeholder: '',
    scorecardMetrics: ''
  });

  // Update form data when editingValueStream changes
  useEffect(() => {
    if (editingValueStream) {
      setFormData({
        name: editingValueStream.name || '',
        description: editingValueStream.description || '',
        color: editingValueStream.color || '#8B5CF6',
        primaryStakeholder: editingValueStream.primaryStakeholder || '',
        scorecardMetrics: editingValueStream.scorecardMetrics || ''
      });
    } else {
      // Reset form when not editing
      setFormData({
        name: '',
        description: '',
        color: '#8B5CF6',
        primaryStakeholder: '',
        scorecardMetrics: ''
      });
    }
  }, [editingValueStream]);

  const predefinedColors = [
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#3B82F6', // Blue
    '#EC4899', // Pink
    '#84CC16', // Lime
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
    if (formData.name.trim()) {
      const valueStream = {
        id: editingValueStream?.id || `vs-${Date.now()}`,
        ...formData,
        name: formData.name.trim()
      };
      
      onSave(valueStream);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        color: '#8B5CF6',
        primaryStakeholder: '',
        scorecardMetrics: ''
      });
      
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Palette className="h-5 w-5" />
            <span>{editingValueStream ? 'Edit Value Stream' : 'Add New Value Stream'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="vsName">Value Stream Name *</Label>
            <Input
              id="vsName"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter value stream name"
            />
          </div>
          
          <div>
            <Label htmlFor="vsDescription">Description</Label>
            <Textarea
              id="vsDescription"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="vsStakeholder" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Primary Stakeholder</span>
            </Label>
            <Input
              id="vsStakeholder"
              value={formData.primaryStakeholder}
              onChange={(e) => handleInputChange('primaryStakeholder', e.target.value)}
              placeholder="Enter primary stakeholder name"
            />
          </div>

          <div>
            <Label htmlFor="vsScorecard" className="flex items-center space-x-2">
              <BarChart2 className="h-4 w-4" />
              <span>Scorecard Metrics</span>
            </Label>
            <Textarea
              id="vsScorecard"
              value={formData.scorecardMetrics}
              onChange={(e) => handleInputChange('scorecardMetrics', e.target.value)}
              placeholder="Enter scorecard metrics and targets"
              rows={4}
            />
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
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: formData.color }}
              />
              <span className="font-medium">{formData.name || 'Value Stream Name'}</span>
            </div>
            {formData.description && (
              <div className="text-sm text-gray-600 mt-1">{formData.description}</div>
            )}
            {formData.primaryStakeholder && (
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Primary Stakeholder:</span> {formData.primaryStakeholder}
              </div>
            )}
            {formData.scorecardMetrics && (
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Scorecard Metrics:</span>
                <div className="mt-1 whitespace-pre-wrap">{formData.scorecardMetrics}</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {editingValueStream ? 'Update' : 'Create'} Value Stream
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ValueStreamForm;

