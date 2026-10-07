import 'package:flutter/material.dart';

import '../../data/models/resource_model.dart';

class UpdateResourceDialog extends StatefulWidget {
  final ResourceModel resource;

  const UpdateResourceDialog({super.key, required this.resource});

  @override
  State<UpdateResourceDialog> createState() => _UpdateResourceDialogState();
}

class _UpdateResourceDialogState extends State<UpdateResourceDialog> {
  late final TextEditingController typeController;
  late final TextEditingController nameController;
  late final TextEditingController availableController;
  late final TextEditingController allocatedController;
  late final TextEditingController locationController;
  late final TextEditingController statusController;

  @override
  void initState() {
    super.initState();

    typeController = TextEditingController(text: widget.resource.resourceType);

    nameController = TextEditingController(text: widget.resource.resourceName);

    availableController = TextEditingController(
      text: widget.resource.availableQuantity.toString(),
    );

    allocatedController = TextEditingController(
      text: widget.resource.allocatedQuantity.toString(),
    );

    locationController = TextEditingController(text: widget.resource.location);

    statusController = TextEditingController(text: widget.resource.status);
  }

  @override
  void dispose() {
    typeController.dispose();
    nameController.dispose();
    availableController.dispose();
    allocatedController.dispose();
    locationController.dispose();
    statusController.dispose();
    super.dispose();
  }

  void _submit() {
    final available = int.tryParse(availableController.text.trim());

    final allocated = int.tryParse(allocatedController.text.trim());

    if (available == null || allocated == null) {
      _showError('Please enter valid quantities.');
      return;
    }

    if (available < 0 || allocated < 0) {
      _showError('Quantities cannot be negative.');
      return;
    }

    if (allocated > available) {
      _showError('Allocated quantity cannot exceed available quantity.');
      return;
    }

    final updated = widget.resource.copyWith(
      resourceType: typeController.text.trim(),
      resourceName: nameController.text.trim(),
      availableQuantity: available,
      allocatedQuantity: allocated,
      location: locationController.text.trim(),
      status: statusController.text.trim().isEmpty
          ? 'Available'
          : statusController.text.trim(),
    );

    Navigator.of(context).pop(updated);
  }

  void _showError(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.all(18),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(25),
        ),
        padding: const EdgeInsets.all(22),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Update Inventory',
                style: TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF06152F),
                ),
              ),
              const SizedBox(height: 5),
              const Text(
                'Update the live resource inventory.',
                style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
              ),
              const SizedBox(height: 22),

              _Field(
                controller: typeController,
                label: 'Resource Type',
                icon: Icons.category_outlined,
              ),

              _Field(
                controller: nameController,
                label: 'Resource Name',
                icon: Icons.inventory_2_outlined,
              ),

              Row(
                children: [
                  Expanded(
                    child: _Field(
                      controller: availableController,
                      label: 'Available',
                      icon: Icons.inventory_outlined,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _Field(
                      controller: allocatedController,
                      label: 'Allocated',
                      icon: Icons.local_shipping_outlined,
                      keyboardType: TextInputType.number,
                    ),
                  ),
                ],
              ),

              _Field(
                controller: locationController,
                label: 'Location',
                icon: Icons.location_on_outlined,
              ),

              _Field(
                controller: statusController,
                label: 'Status',
                icon: Icons.flag_outlined,
              ),

              const SizedBox(height: 8),

              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        Navigator.of(context).pop();
                      },
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(13),
                        ),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0369A1),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(13),
                        ),
                      ),
                      child: const Text(
                        'Save Changes',
                        style: TextStyle(fontWeight: FontWeight.w800),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;

  const _Field({
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, size: 19),
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(13),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(13),
            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
        ),
      ),
    );
  }
}
